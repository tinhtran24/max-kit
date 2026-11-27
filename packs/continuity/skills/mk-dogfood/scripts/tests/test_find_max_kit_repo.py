import argparse
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import find_max_kit_repo as finder  # noqa: E402

HAS_GIT = shutil.which('git') is not None


def make_checkout(path, remote=None, name='origin'):
    (path / 'packs' / 'workflow').mkdir(parents=True)
    (path / 'packs' / 'workflow' / 'pack.json').write_text('{"description": "x"}\n', encoding='utf-8')
    if remote and HAS_GIT:
        subprocess.run(['git', 'init', '-q', str(path)], check=True)
        subprocess.run(['git', '-C', str(path), 'remote', 'add', name, remote], check=True)
    return path


def args(**overrides):
    base = {'root': [], 'max_depth': 4, 'limit': 5, 'no_scan': True}
    base.update(overrides)
    return argparse.Namespace(**base)


class CanonicalRemoteTest(unittest.TestCase):
    def test_accepts_https_and_ssh_forms(self):
        for url in ('https://github.com/tinhtran24/max-kit.git',
                    'https://github.com/tinhtran24/max-kit/',
                    'git@github.com:tinhtran24/max-kit.git',
                    'ssh://git@github.com/tinhtran24/max-kit'):
            self.assertTrue(finder.canonical_remote(url), url)

    def test_rejects_other_repositories(self):
        for url in ('https://github.com/someone/max-kit.git',
                    'https://github.com/acme/docs.git',
                    'git@github.com:acme/web.git'):
            self.assertFalse(finder.canonical_remote(url), url)


class LocateTest(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)

    def test_env_repo_wins(self):
        repo = make_checkout(self.tmp / 'somewhere' / 'max-kit')
        result = finder.locate(args(), env={'MAX_KIT_REPO': str(repo)}, cwd=self.tmp)
        self.assertTrue(result['found'])
        self.assertEqual(result['repo']['source'], 'env:MAX_KIT_REPO')
        self.assertEqual(Path(result['repo']['path']), repo.resolve())

    def test_packs_dir_parent(self):
        repo = make_checkout(self.tmp / 'max-kit')
        result = finder.locate(args(), env={'MAX_KIT_PACKS_DIR': str(repo / 'packs')}, cwd=self.tmp)
        self.assertEqual(result['repo']['source'], 'env:MAX_KIT_PACKS_DIR')

    def test_cwd_ancestor(self):
        repo = make_checkout(self.tmp / 'max-kit')
        nested = repo / 'packs' / 'workflow'
        result = finder.locate(args(), env={}, cwd=nested)
        self.assertEqual(result['repo']['source'], 'cwd')
        self.assertEqual(Path(result['repo']['path']), repo.resolve())

    def test_nothing_found(self):
        result = finder.locate(args(), env={}, cwd=self.tmp)
        self.assertFalse(result['found'])
        self.assertIsNone(result['repo'])

    def test_scan_skips_hidden_and_heavy_dirs(self):
        make_checkout(self.tmp / 'node_modules' / 'max-kit')
        make_checkout(self.tmp / '.cache' / 'max-kit')
        repo = make_checkout(self.tmp / 'code' / 'max-kit')
        found = list(finder.scan(self.tmp, 4))
        self.assertEqual([p.resolve() for p in found], [repo.resolve()])

    def test_scan_respects_depth(self):
        make_checkout(self.tmp / 'a' / 'b' / 'c' / 'max-kit')
        self.assertEqual(list(finder.scan(self.tmp, 2)), [])

    @unittest.skipUnless(HAS_GIT, 'git is not installed')
    def test_linked_worktree_resolves_to_main_checkout(self):
        repo = make_checkout(self.tmp / 'max-kit', 'https://github.com/tinhtran24/max-kit.git')
        git = ['git', '-C', str(repo), '-c', 'user.name=t', '-c', 'user.email=t@example.invalid']
        subprocess.run(git + ['add', '.'], check=True)
        subprocess.run(git + ['commit', '-qm', 'init'], check=True)
        linked = self.tmp / 'elsewhere' / 'wt'
        subprocess.run(git + ['worktree', 'add', '-q', str(linked)], check=True)
        result = finder.locate(args(), env={}, cwd=linked)
        self.assertEqual(Path(result['repo']['path']), repo.resolve())
        self.assertFalse(result['repo']['linked_worktree'])

    @unittest.skipUnless(HAS_GIT, 'git is not installed')
    def test_verified_checkout_ranks_first(self):
        make_checkout(self.tmp / 'one' / 'max-kit', 'https://github.com/someone/max-kit.git')
        good = make_checkout(self.tmp / 'two' / 'max-kit', 'git@github.com:tinhtran24/max-kit.git',
                             name='upstream')
        result = finder.locate(args(no_scan=False, root=[str(self.tmp)], max_depth=2), env={},
                               cwd=self.tmp)
        self.assertEqual(Path(result['repo']['path']), good.resolve())
        self.assertTrue(result['repo']['verified'])
        self.assertEqual(result['repo']['canonical_remote'], 'upstream')


if __name__ == '__main__':
    unittest.main()
