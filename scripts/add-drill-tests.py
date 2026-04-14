#!/usr/bin/env python3
"""
Add setup/check test cases to all 120 drills in drills.json.
Validates each test by running expectedCode against the test case.
"""
import json
import sys
from pathlib import Path

DRILLS_PATH = Path(__file__).parent.parent / "drills.json"

# === Common setup blocks ===

TREE_SETUP = (
    "class TreeNode:\n"
    "    def __init__(self, val=0, left=None, right=None):\n"
    "        self.val = val\n"
    "        self.left = left\n"
    "        self.right = right"
)

LIST_SETUP = (
    "class ListNode:\n"
    "    def __init__(self, val=0, next=None):\n"
    "        self.val = val\n"
    "        self.next = next\n"
    "def _build(arr):\n"
    "    d = ListNode(0)\n"
    "    c = d\n"
    "    for v in arr:\n"
    "        c.next = ListNode(v)\n"
    "        c = c.next\n"
    "    return d.next\n"
    "def _to_arr(h):\n"
    "    a = []\n"
    "    while h:\n"
    "        a.append(h.val)\n"
    "        h = h.next\n"
    "    return a"
)

UF_SETUP = (
    "class UnionFind:\n"
    "    def __init__(self, n):\n"
    "        self.parent = list(range(n))\n"
    "        self.rank = [0] * n\n"
    "    def find(self, x):\n"
    "        if self.parent[x] != x:\n"
    "            self.parent[x] = self.find(self.parent[x])\n"
    "        return self.parent[x]\n"
    "    def union(self, x, y):\n"
    "        px, py = self.find(x), self.find(y)\n"
    "        if px == py:\n"
    "            return False\n"
    "        if self.rank[px] < self.rank[py]:\n"
    "            px, py = py, px\n"
    "        self.parent[py] = px\n"
    "        if self.rank[px] == self.rank[py]:\n"
    "            self.rank[px] += 1\n"
    "        return True"
)

TRIE_SETUP = (
    "class TrieNode:\n"
    "    def __init__(self):\n"
    "        self.children = {}\n"
    "        self.is_end = False\n"
    "class Trie:\n"
    "    def __init__(self):\n"
    "        self.root = TrieNode()\n"
    "    def insert(self, word):\n"
    "        node = self.root\n"
    "        for c in word:\n"
    "            if c not in node.children:\n"
    "                node.children[c] = TrieNode()\n"
    "            node = node.children[c]\n"
    "        node.is_end = True"
)

# === Test cases by drill index ===

TESTS = {}

# 0: Create frequency counter with Counter
TESTS[0] = [
    {"setup": "words = ['apple', 'banana', 'apple', 'cherry', 'banana', 'apple']",
     "check": "word_count['apple'] == 3 and word_count['banana'] == 2 and word_count['cherry'] == 1"},
    {"setup": "words = ['a']",
     "check": "word_count['a'] == 1 and len(word_count) == 1"},
]

# 1: Build dict from two parallel lists
TESTS[1] = [
    {"setup": "keys = ['a', 'b', 'c']\nvalues = [1, 2, 3]",
     "check": "d == {'a': 1, 'b': 2, 'c': 3}"},
    {"setup": "keys = ['x']\nvalues = [10]",
     "check": "d == {'x': 10}"},
]

# 2: defaultdict for grouping
TESTS[2] = [
    {"setup": "records = [('Alice', 90), ('Bob', 80), ('Alice', 95)]",
     "check": "dict(grouped) == {'Alice': [90, 95], 'Bob': [80]}"},
    {"setup": "records = [('X', 1), ('Y', 2), ('X', 3), ('Y', 4)]",
     "check": "grouped['X'] == [1, 3] and grouped['Y'] == [2, 4]"},
]

# 3: Check membership with a set
TESTS[3] = [
    {"setup": "nums = [1, 2, 3, 4, 5]\ntarget = 3",
     "check": "exists == True and isinstance(num_set, set)"},
    {"setup": "nums = [10, 20, 30]\ntarget = 5",
     "check": "exists == False"},
]

# 4: Dict comprehension with condition
TESTS[4] = [
    {"setup": "scores = {'Alice': 90, 'Bob': 55, 'Charlie': 72, 'Dave': 40}",
     "check": "passing == {'Alice': 90, 'Charlie': 72}"},
    {"setup": "scores = {'A': 60, 'B': 59}",
     "check": "passing == {'A': 60}"},
]

# 5: Counter most common
TESTS[5] = [
    {"setup": "s = 'aabbbcccc'",
     "check": "top3[0][0] == 'c' and top3[1][0] == 'b' and top3[2][0] == 'a'"},
    {"setup": "s = 'zzzyyx'",
     "check": "top3[0] == ('z', 3) and len(top3) == 3"},
]

# 6: Anagram grouping with defaultdict
TESTS[6] = [
    {"setup": "strs = ['eat', 'tea', 'tan', 'ate', 'nat', 'bat']",
     "check": "sorted([sorted(g) for g in result]) == [['ate', 'eat', 'tea'], ['bat'], ['nat', 'tan']]"},
    {"setup": "strs = ['a']",
     "check": "result == [['a']]"},
]

# 7: Two-sum with hash map (bare return)
TESTS[7] = [
    {"setup": "nums = [2, 7, 11, 15]\ntarget = 9",
     "check": "sorted(_result) == [0, 1]"},
    {"setup": "nums = [3, 2, 4]\ntarget = 6",
     "check": "sorted(_result) == [1, 2]"},
]

# 8: Basic two-pointer converging (bare return)
TESTS[8] = [
    {"setup": "nums = [1, 3, 5, 7, 9]\ntarget = 8",
     "check": "_result == [0, 3]"},
    {"setup": "nums = [2, 4, 6, 8]\ntarget = 10",
     "check": "_result == [0, 3]"},
]

# 9: In-place swap with two pointers
TESTS[9] = [
    {"setup": "nums = [1, 2, 3, 4, 5]",
     "check": "nums == [5, 4, 3, 2, 1]"},
    {"setup": "nums = [10, 20]",
     "check": "nums == [20, 10]"},
]

# 10: Remove duplicates from sorted array (bare return)
TESTS[10] = [
    {"setup": "nums = [1, 1, 2, 3, 3, 4]",
     "check": "_result == 4 and nums[:4] == [1, 2, 3, 4]"},
    {"setup": "nums = [1, 1, 1]",
     "check": "_result == 1"},
]

# 11: Palindrome check (bare return)
TESTS[11] = [
    {"setup": "s = 'A man, a plan, a canal: Panama'",
     "check": "_result == True"},
    {"setup": "s = 'race a car'",
     "check": "_result == False"},
]

# 12: Three sum (bare return)
TESTS[12] = [
    {"setup": "nums = [-1, 0, 1, 2, -1, -4]",
     "check": "sorted([sorted(t) for t in _result]) == [[-1, -1, 2], [-1, 0, 1]]"},
    {"setup": "nums = [0, 0, 0]",
     "check": "_result == [[0, 0, 0]]"},
]

# 13: List as a stack
TESTS[13] = [
    {"setup": "",
     "check": "top == 3 and peek == 2 and stack == [1, 2]"},
]

# 14: Valid parentheses (bare return)
TESTS[14] = [
    {"setup": "s = '({[]})'",
     "check": "_result == True"},
    {"setup": "s = '([)]'",
     "check": "_result == False"},
]

# 15: Monotonic decreasing stack (bare return)
TESTS[15] = [
    {"setup": "temps = [73, 74, 75, 71, 69, 72, 76, 73]",
     "check": "_result == [1, 1, 4, 2, 1, 1, 0, 0]"},
]

# 16: Evaluate RPN (bare return)
TESTS[16] = [
    {"setup": "tokens = ['2', '1', '+', '3', '*']",
     "check": "_result == 9"},
    {"setup": "tokens = ['4', '13', '5', '/', '+']",
     "check": "_result == 6"},
]

# 17: Recursive DFS maxDepth (function def)
TESTS[17] = [
    {"setup": f"{TREE_SETUP}\nroot = TreeNode(1, TreeNode(2, TreeNode(4), None), TreeNode(3))",
     "check": "maxDepth(root) == 3"},
    {"setup": f"{TREE_SETUP}\nroot = None",
     "check": "maxDepth(root) == 0"},
]

# 18: BFS level-order traversal (bare return)
TESTS[18] = [
    {"setup": f"{TREE_SETUP}\nroot = TreeNode(1, TreeNode(2, TreeNode(4), TreeNode(5)), TreeNode(3))",
     "check": "_result == [[1], [2, 3], [4, 5]]"},
    {"setup": f"{TREE_SETUP}\nroot = None",
     "check": "_result == []"},
]

# 19: DFS diameter (function def)
TESTS[19] = [
    {"setup": f"{TREE_SETUP}\nroot = TreeNode(1, TreeNode(2, TreeNode(4), TreeNode(5)), TreeNode(3))",
     "check": "diameterOfBinaryTree(root) == 3"},
]

# 20: Invert binary tree (function def)
TESTS[20] = [
    {"setup": f"{TREE_SETUP}\nroot = TreeNode(1, TreeNode(2), TreeNode(3))",
     "check": "invertTree(root) and root.left.val == 3 and root.right.val == 2"},
]

# 21: Validate BST (function def)
TESTS[21] = [
    {"setup": f"{TREE_SETUP}\nroot = TreeNode(2, TreeNode(1), TreeNode(3))",
     "check": "isValidBST(root) == True"},
    {"setup": f"{TREE_SETUP}\nroot = TreeNode(1, TreeNode(2), TreeNode(3))",
     "check": "isValidBST(root) == False"},
]

# 22: Fixed-size sliding window (bare return)
TESTS[22] = [
    {"setup": "nums = [2, 1, 5, 1, 3, 2]\nk = 3",
     "check": "_result == 9"},
    {"setup": "nums = [1]\nk = 1",
     "check": "_result == 1"},
]

# 23: Variable-size sliding window (bare return)
TESTS[23] = [
    {"setup": "s = 'abcabcbb'",
     "check": "_result == 3"},
    {"setup": "s = 'bbbbb'",
     "check": "_result == 1"},
]

# 24: Sliding window with Counter (bare return)
TESTS[24] = [
    {"setup": "s = 'ADOBECODEBANC'\nt = 'ABC'",
     "check": "_result == 'BANC'"},
]

# 25: Deque for sliding window maximum (bare return)
TESTS[25] = [
    {"setup": "nums = [1, 3, -1, -3, 5, 3, 6, 7]\nk = 3",
     "check": "_result == [3, 3, 5, 5, 6, 7]"},
]

# 26: bisect_left and bisect_right
TESTS[26] = [
    {"setup": "nums = [1, 2, 2, 2, 3, 4]\ntarget = 2",
     "check": "left_pos == 1 and right_pos == 4"},
    {"setup": "nums = [1, 3, 5]\ntarget = 3",
     "check": "left_pos == 1 and right_pos == 2"},
]

# 27: Manual binary search (bare return)
TESTS[27] = [
    {"setup": "nums = [1, 3, 5, 7, 9, 11]\ntarget = 7",
     "check": "_result == 3"},
    {"setup": "nums = [1, 3, 5]\ntarget = 4",
     "check": "_result == -1"},
]

# 28: Binary search on answer space (bare return)
TESTS[28] = [
    {"setup": "import math\npiles = [3, 6, 7, 11]\nh = 8",
     "check": "_result == 4"},
    {"setup": "import math\npiles = [30, 11, 23, 4, 20]\nh = 5",
     "check": "_result == 30"},
]

# 29: Search in rotated sorted array (bare return)
TESTS[29] = [
    {"setup": "nums = [4, 5, 6, 7, 0, 1, 2]\ntarget = 0",
     "check": "_result == 4"},
    {"setup": "nums = [4, 5, 6, 7, 0, 1, 2]\ntarget = 3",
     "check": "_result == -1"},
]

# 30: Define ListNode + build linked list
TESTS[30] = [
    {"setup": "",
     "check": "head.val == 1 and head.next.val == 2 and head.next.next.val == 3 and head.next.next.next is None"},
]

# 31: Reverse linked list (bare return)
TESTS[31] = [
    {"setup": f"{LIST_SETUP}\nhead = _build([1, 2, 3, 4, 5])",
     "check": "_to_arr(_result) == [5, 4, 3, 2, 1]"},
    {"setup": f"{LIST_SETUP}\nhead = _build([1])",
     "check": "_to_arr(_result) == [1]"},
]

# 32: Cycle detection (bare return)
TESTS[32] = [
    {"setup": f"{LIST_SETUP}\nhead = _build([1, 2, 3, 4])\nhead.next.next.next.next = head.next",
     "check": "_result == True"},
    {"setup": f"{LIST_SETUP}\nhead = _build([1, 2, 3])",
     "check": "_result == False"},
]

# 33: Merge two sorted linked lists (bare return)
TESTS[33] = [
    {"setup": f"{LIST_SETUP}\nl1 = _build([1, 3, 5])\nl2 = _build([2, 4, 6])",
     "check": "_to_arr(_result) == [1, 2, 3, 4, 5, 6]"},
]

# 34: Build adjacency list
TESTS[34] = [
    {"setup": "edges = [(0, 1), (1, 2), (0, 2)]",
     "check": "sorted(graph[0]) == [1, 2] and 0 in graph[1] and 0 in graph[2]"},
]

# 35: BFS traversal (bare return)
TESTS[35] = [
    {"setup": "graph = {0: [1, 2], 1: [0, 3], 2: [0, 3], 3: [1, 2]}\nstart = 0",
     "check": "set(_result) == {0, 1, 2, 3} and _result[0] == 0"},
]

# 36: DFS iterative (bare return)
TESTS[36] = [
    {"setup": "graph = {0: [1, 2], 1: [0, 3], 2: [0, 3], 3: [1, 2]}\nstart = 0",
     "check": "set(_result) == {0, 1, 2, 3}"},
]

# 37: Topological sort (bare return)
TESTS[37] = [
    {"setup": "numCourses = 4\nprerequisites = [(1,0),(2,0),(3,1),(3,2)]",
     "check": "len(_result) == 4 and _result.index(0) < _result.index(1) and _result.index(0) < _result.index(2) and _result.index(1) < _result.index(3)"},
]

# 38: heapq basics
TESTS[38] = [
    {"setup": "",
     "check": "smallest == 1 and sorted(heap) == [3, 5]"},
]

# 39: Max-heap with negative trick
TESTS[39] = [
    {"setup": "",
     "check": "largest == 5"},
]

# 40: Top K frequent (bare return)
TESTS[40] = [
    {"setup": "nums = [1, 1, 1, 2, 2, 3]\nk = 2",
     "check": "sorted(_result) == [1, 2]"},
]

# 41: Merge K sorted lists (bare return)
TESTS[41] = [
    {"setup": f"{LIST_SETUP}\nlists = [_build([1,4,5]), _build([1,3,4]), _build([2,6])]",
     "check": "_to_arr(_result) == [1, 1, 2, 3, 4, 4, 5, 6]"},
]

# 42: Backtracking subsets (bare return)
TESTS[42] = [
    {"setup": "nums = [1, 2, 3]",
     "check": "sorted([sorted(s) for s in _result]) == [[], [1], [1,2], [1,2,3], [1,3], [2], [2,3], [3]]"},
]

# 43: Permutations (bare return)
TESTS[43] = [
    {"setup": "nums = [1, 2, 3]",
     "check": "len(_result) == 6 and [1,2,3] in _result and [3,2,1] in _result"},
]

# 44: Combinations with pruning (bare return)
TESTS[44] = [
    {"setup": "n = 4\nk = 2",
     "check": "len(_result) == 6 and [1,2] in _result and [3,4] in _result"},
]

# 45: Subsets II (bare return)
TESTS[45] = [
    {"setup": "nums = [1, 2, 2]",
     "check": "sorted([sorted(s) for s in _result]) == [[], [1], [1,2], [1,2,2], [2], [2,2]]"},
]

# 46: Memoization with @cache (function def)
TESTS[46] = [
    {"setup": "",
     "check": "fib(10) == 55 and fib(0) == 0 and fib(1) == 1"},
]

# 47: 1D tabulation climbing stairs (bare return)
TESTS[47] = [
    {"setup": "n = 5",
     "check": "_result == 8"},
    {"setup": "n = 3",
     "check": "_result == 3"},
]

# 48: 2D DP unique paths (bare return)
TESTS[48] = [
    {"setup": "m = 3\nn = 3",
     "check": "_result == 6"},
    {"setup": "m = 3\nn = 7",
     "check": "_result == 28"},
]

# 49: 0/1 Knapsack (bare return)
TESTS[49] = [
    {"setup": "n = 3\ncapacity = 5\nweights = [1, 2, 3]\nvalues = [6, 10, 12]",
     "check": "_result == 22"},
]

# 50: Sort intervals by end time (in-place)
TESTS[50] = [
    {"setup": "intervals = [[3, 5], [1, 4], [2, 6]]",
     "check": "intervals == [[1, 4], [3, 5], [2, 6]]"},
]

# 51: Interval scheduling (bare return)
TESTS[51] = [
    {"setup": "intervals = [(1, 3), (2, 5), (4, 7), (6, 8)]",
     "check": "_result == 2"},
]

# 52: Jump game (bare return)
TESTS[52] = [
    {"setup": "nums = [2, 3, 1, 1, 4]",
     "check": "_result == True"},
    {"setup": "nums = [3, 2, 1, 0, 4]",
     "check": "_result == False"},
]

# 53: Counter vs defaultdict (L3)
TESTS[53] = [
    {"setup": "s = 'aaaabc'",
     "check": "majority == ['a'] and count['a'] == 4"},
    {"setup": "s = 'aabb'",
     "check": "majority == [] and count['a'] == 2"},
]

# 54: set vs dict for lookups — SKIP (two separate patterns with incompatible variable types)

# 55: Expand-from-center palindromes (bare return)
TESTS[55] = [
    {"setup": "s = 'babad'",
     "check": "_result in ('bab', 'aba')"},
    {"setup": "s = 'cbbd'",
     "check": "_result == 'bb'"},
]

# 56: Sort vs hash map overlap detection (bare return)
TESTS[56] = [
    {"setup": "intervals = [[1, 3], [2, 5], [6, 8]]",
     "check": "_result == True"},
    {"setup": "intervals = [[1, 2], [3, 4], [5, 6]]",
     "check": "_result == False"},
]

# 57: Shrink window condition — SKIP (pseudocode with undefined functions)

# 58: bisect_left find/insert/count
TESTS[58] = [
    {"setup": "nums = [1, 2, 2, 2, 3, 4]\ntarget = 2",
     "check": "exists == True and insert_pos == 1 and count == 3"},
    {"setup": "nums = [1, 3, 5]\ntarget = 2",
     "check": "exists == False and insert_pos == 1 and count == 0"},
]

# 59: Dummy head remove values (bare return)
TESTS[59] = [
    {"setup": f"{LIST_SETUP}\nhead = _build([1, 2, 3, 2, 4])\nval = 2",
     "check": "_to_arr(_result) == [1, 3, 4]"},
]

# 60: BFS shortest path (function def)
TESTS[60] = [
    {"setup": "graph = {0: [1, 2], 1: [0, 3], 2: [0, 3], 3: [1, 2]}",
     "check": "shortest_path(graph, 0, 3) == 2"},
]

# 61: Heap vs sorting — top k smallest (uses stream, k)
TESTS[61] = [
    {"setup": "stream = [5, 3, 8, 1, 9, 2, 7]\nk = 3",
     "check": "sorted(result) == [1, 2, 3]"},
]

# 62: Subsets vs permutations — SKIP (pure comments)

# 63: Top-down vs bottom-up DP (bare return at bottom)
TESTS[63] = [
    {"setup": "coins = [1, 5, 10]\namount = 11",
     "check": "_result == 2"},
    {"setup": "coins = [2]\namount = 3",
     "check": "_result == -1"},
]

# 64: Greedy vs DP — greedy_change function
TESTS[64] = [
    {"setup": "",
     "check": "greedy_change(41) == 4"},
    {"setup": "",
     "check": "greedy_change(30) == 2"},
]

# 65: Sliding window + hash map combo (bare return)
TESTS[65] = [
    {"setup": "s = 'eceba'\nk = 2",
     "check": "_result == 3"},
    {"setup": "s = 'aa'\nk = 1",
     "check": "_result == 2"},
]

# 66: Two pointers + binary search combo (bare return)
TESTS[66] = [
    {"setup": "nums = [1, 2, 3, 4, 5]\ndiff = 2",
     "check": "_result == 3"},
]

# 67: NestedIterator class
TESTS[67] = [
    {"setup": "def _test(NI):\n    ni = NI([[1, [2]], 3, [4, [5]]])\n    r = []\n    while ni.hasNext():\n        r.append(ni.next())\n    return r == [1, 2, 3, 4, 5]",
     "check": "_test(NestedIterator)"},
]

# 68: Tree + hash map pathSum (function def)
TESTS[68] = [
    {"setup": f"{TREE_SETUP}\nroot = TreeNode(1, TreeNode(2), TreeNode(3))",
     "check": "pathSum(root, 3) == 2"},
]

# 69: Dijkstra's shortest path (function def, list-based dist)
TESTS[69] = [
    {"setup": "_g = {0: [(1, 4), (2, 1)], 1: [(3, 1)], 2: [(1, 2), (3, 5)], 3: []}",
     "check": "dijkstra(_g, 0, 4) == [0, 3, 1, 4]"},
]

# 70: Meeting rooms II (bare return)
TESTS[70] = [
    {"setup": "intervals = [(0, 30), (5, 10), (15, 20)]",
     "check": "_result == 2"},
    {"setup": "intervals = [(7, 10), (2, 4)]",
     "check": "_result == 1"},
]

# 71: Backtracking + trie word search II (function def)
TESTS[71] = [
    {"setup": "",
     "check": "sorted(findWords([['o','a','a','n'],['e','t','a','e'],['i','h','k','r'],['i','f','l','v']], ['oath','pea','eat','rain'])) == ['eat', 'oath']"},
]

# 72: DP + binary search LIS (bare return)
TESTS[72] = [
    {"setup": "nums = [10, 9, 2, 5, 3, 7, 101, 18]",
     "check": "_result == 4"},
]

# 73: Greedy + stack largest number removal (bare return)
TESTS[73] = [
    {"setup": "num = '1432219'\nk = 3",
     "check": "_result == '1219'"},
    {"setup": "num = '10200'\nk = 1",
     "check": "_result == '200'"},
]

# 74: 2D grid DP minimum path sum (no return, check dp table)
TESTS[74] = [
    {"setup": "grid = [[1,3,1],[1,5,1],[4,2,1]]\nm = 3\nn = 3",
     "check": "dp[2][2] == 7"},
]

# 75: LCS (no return, check dp table)
TESTS[75] = [
    {"setup": "text1 = 'abcde'\ntext2 = 'ace'",
     "check": "dp[len(text1)][len(text2)] == 3"},
]

# 76: Edit distance (no return, check dp table)
TESTS[76] = [
    {"setup": "word1 = 'horse'\nword2 = 'ros'",
     "check": "dp[len(word1)][len(word2)] == 3"},
]

# 77: 2D DP space optimization rolling array
TESTS[77] = [
    {"setup": "m = 3\nn = 3",
     "check": "dp == [1, 3, 6]"},
]

# 78: House robber (bare return)
TESTS[78] = [
    {"setup": "nums = [1, 2, 3, 1]",
     "check": "_result == 4"},
    {"setup": "nums = [2, 7, 9, 3, 1]",
     "check": "_result == 12"},
]

# 79: Coin change (bare return)
TESTS[79] = [
    {"setup": "coins = [1, 5, 10]\namount = 11",
     "check": "_result == 2"},
    {"setup": "coins = [2]\namount = 3",
     "check": "_result == -1"},
]

# 80: Word break (no return, check dp)
TESTS[80] = [
    {"setup": "s = 'leetcode'\nwordDict = ['leet', 'code']",
     "check": "dp[len(s)] == True"},
    {"setup": "s = 'catsandog'\nwordDict = ['cats', 'dog', 'sand', 'and', 'cat']",
     "check": "dp[len(s)] == False"},
]

# 81: Union-Find class
TESTS[81] = [
    {"setup": "def _test_uf(UF):\n    uf = UF(5)\n    uf.union(0, 1)\n    uf.union(2, 3)\n    return uf.find(0) == uf.find(1) and uf.find(2) == uf.find(3) and uf.find(0) != uf.find(2)",
     "check": "_test_uf(UnionFind)"},
]

# 82: Dijkstra dict-based (function def)
TESTS[82] = [
    {"setup": "_g = {'A': [('B', 4), ('C', 1)], 'B': [('D', 1)], 'C': [('B', 2), ('D', 5)], 'D': []}",
     "check": "dijkstra(_g, 'A') == {'A': 0, 'B': 3, 'C': 1, 'D': 4}"},
]

# 83: Kruskal's MST (bare return, needs UnionFind)
TESTS[83] = [
    {"setup": f"{UF_SETUP}\nedges = [(1, 0, 1), (2, 1, 2), (3, 0, 2)]\nn = 3",
     "check": "_result == 3"},
]

# 84: Topological sort with DFS (function def)
TESTS[84] = [
    {"setup": "from collections import defaultdict\ndef _valid_topo(order, n, edges):\n    if len(order) != n: return False\n    pos = {v:i for i,v in enumerate(order)}\n    return all(pos[u] < pos[v] for u,v in edges)",
     "check": "_valid_topo(topo_sort(4, [(0,1),(0,2),(1,3),(2,3)]), 4, [(0,1),(0,2),(1,3),(2,3)])"},
]

# 85: Check if power of 2 — NOTE: expectedCode has precedence bug, will be fixed
TESTS[85] = [
    {"setup": "n = 16",
     "check": "is_power == True"},
    {"setup": "n = 6",
     "check": "is_power == False"},
    {"setup": "n = 1",
     "check": "is_power == True"},
]

# 86: Count set bits
TESTS[86] = [
    {"setup": "n = 11",
     "check": "count == 3"},
    {"setup": "n = 0",
     "check": "count == 0"},
]

# 87: XOR single number
TESTS[87] = [
    {"setup": "nums = [2, 2, 1]",
     "check": "result == 1"},
    {"setup": "nums = [4, 1, 2, 1, 2]",
     "check": "result == 4"},
]

# 88: Get, set, clear bits
TESTS[88] = [
    {"setup": "n = 10\ni = 1",
     "check": "get_bit == 1 and set_bit == 10 and clear_bit == 8"},
    {"setup": "n = 10\ni = 2",
     "check": "get_bit == 0 and set_bit == 14 and clear_bit == 10"},
]

# 89: Bitmask DP vs XOR — SKIP (pure comments)
# 90: Bitmask subsets — SKIP (iteration placeholder)

# 91: Sort intervals by start time
TESTS[91] = [
    {"setup": "intervals = [[3, 5], [1, 4], [6, 8]]\ni = 1",
     "check": "intervals == [[1, 4], [3, 5], [6, 8]] and overlap == True"},
]

# 92: Merge overlapping intervals (bare return)
TESTS[92] = [
    {"setup": "intervals = [[1,3],[2,6],[8,10],[15,18]]",
     "check": "_result == [[1,6],[8,10],[15,18]]"},
]

# 93: Insert into sorted intervals (bare return)
TESTS[93] = [
    {"setup": "intervals = [[1,3],[6,9]]\nnewInterval = [2,5]",
     "check": "_result == [[1,5],[6,9]]"},
]

# 94: Meeting rooms sweep line
TESTS[94] = [
    {"setup": "intervals = [(0, 30), (5, 10), (15, 20)]",
     "check": "max_rooms == 2"},
]

# 95: GCD and LCM
TESTS[95] = [
    {"setup": "a = 12\nb = 8",
     "check": "g == 4 and lcm == 24"},
]

# 96: Modular arithmetic
TESTS[96] = [
    {"setup": "a = 100\nb = 200",
     "check": "MOD == 10**9 + 7 and result == (100 * 200) % MOD"},
]

# 97: Rotate matrix 90° (in-place)
TESTS[97] = [
    {"setup": "matrix = [[1,2,3],[4,5,6],[7,8,9]]",
     "check": "matrix == [[7,4,1],[8,5,2],[9,6,3]]"},
]

# 98: Sieve of Eratosthenes
TESTS[98] = [
    {"setup": "n = 20",
     "check": "primes == [2, 3, 5, 7, 11, 13, 17, 19]"},
]

# 99: max_points function
TESTS[99] = [
    {"setup": "",
     "check": "max_points([[1,1],[2,2],[3,3]]) == 3"},
]

# 100: Spiral matrix (bare return)
TESTS[100] = [
    {"setup": "matrix = [[1,2,3],[4,5,6],[7,8,9]]",
     "check": "_result == [1,2,3,6,9,8,7,4,5]"},
]

# 101: Trie insert and search (class def)
TESTS[101] = [
    {"setup": "def _test(TN, T):\n    t = T()\n    t.insert('apple')\n    return t.search('apple') == True and t.search('app') == False",
     "check": "_test(TrieNode, Trie)"},
]

# 102: Trie startsWith (method def)
TESTS[102] = [
    {"setup": (
        "class _TN:\n"
        "    def __init__(self):\n"
        "        self.children = {}\n"
        "        self.is_end = False\n"
        "class _T:\n"
        "    def __init__(self):\n"
        "        self.root = _TN()\n"
        "    def insert(self, word):\n"
        "        node = self.root\n"
        "        for c in word:\n"
        "            if c not in node.children:\n"
        "                node.children[c] = _TN()\n"
        "            node = node.children[c]\n"
        "        node.is_end = True\n"
        "_t = _T()\n"
        "_t.insert('apple')"
    ),
     "check": "startsWith(_t, 'app') == True and startsWith(_t, 'ban') == False"},
]

# 103: Trie vs hash set — SKIP (pure comments)

# 104: Trie + DFS word search II — NOTE: expectedCode missing return, will be fixed
TESTS[104] = [
    {"setup": TRIE_SETUP,
     "check": "sorted(findWords([['o','a','a','n'],['e','t','a','e'],['i','h','k','r'],['i','f','l','v']], ['oath','pea','eat','rain'])) == ['eat', 'oath']"},
]

# 105: Monotonic stack pattern (L3, code at end)
TESTS[105] = [
    {"setup": "nums = [2, 1, 4, 3]\nresult = [0] * len(nums)",
     "check": "result == [4, 4, 0, 0]"},
]

# 106: DFS return vs nonlocal
TESTS[106] = [
    {"setup": f"{TREE_SETUP}\nroot = TreeNode(1, TreeNode(2, TreeNode(4), TreeNode(5)), TreeNode(3))",
     "check": "maxDepth(root) == 3 and diameter(root) == 3"},
]

# 107: Binary search + greedy split array (bare return)
TESTS[107] = [
    {"setup": "nums = [7, 2, 5, 10, 8]\nk = 2",
     "check": "_result == 18"},
]

# 108: LRU Cache class
TESTS[108] = [
    {"setup": "def _test(NC, LRUC):\n    c = LRUC(2)\n    c.put(1, 1)\n    c.put(2, 2)\n    r1 = c.get(1)\n    c.put(3, 3)\n    r2 = c.get(2)\n    c.put(4, 4)\n    r3 = c.get(1)\n    r4 = c.get(3)\n    r5 = c.get(4)\n    return r1 == 1 and r2 == -1 and r3 == -1 and r4 == 3 and r5 == 4",
     "check": "_test(Node, LRUCache)"},
]

# 109: Character to freq index — SKIP (bare expression, no stored result)

# 110: Zero-initialized frequency array
TESTS[110] = [
    {"setup": "",
     "check": "freq == [0] * 26 and len(freq) == 26"},
]

# 111: Count character frequencies
TESTS[111] = [
    {"setup": "word = 'hello'\nfreq = [0] * 26",
     "check": "freq[ord('h') - ord('a')] == 1 and freq[ord('l') - ord('a')] == 2 and freq[ord('e') - ord('a')] == 1"},
]

# 112: Convert frequency list to tuple key
TESTS[112] = [
    {"setup": "freq = [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]",
     "check": "key == tuple(freq) and isinstance(key, tuple)"},
]

# 113: Append to anagram group
TESTS[113] = [
    {"setup": "from collections import defaultdict\nanagram_map = defaultdict(list)\nfreq = [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0]\nword = 'eat'",
     "check": "anagram_map[tuple(freq)] == ['eat']"},
]

# 114: Return all groups (bare return)
TESTS[114] = [
    {"setup": "from collections import defaultdict\nanagram_map = defaultdict(list)\nanagram_map[(1,0)].append('a')\nanagram_map[(0,1)].append('b')",
     "check": "sorted([sorted(g) for g in _result]) == [['a'], ['b']]"},
]

# 115: Anagram key function
TESTS[115] = [
    {"setup": "",
     "check": "anagram_key('eat') == anagram_key('tea') and anagram_key('eat') != anagram_key('bat')"},
]

# 116: Group Anagrams full (function def)
TESTS[116] = [
    {"setup": "",
     "check": "sorted([sorted(g) for g in groupAnagrams(['eat','tea','tan','ate','nat','bat'])]) == [['ate', 'eat', 'tea'], ['bat'], ['nat', 'tan']]"},
]

# 117: Group by digit frequency (L5, replace old testCases)
TESTS[117] = [
    {"setup": "",
     "check": "sorted([sorted(g) for g in groupByDigitFreq(['123', '321', '456', '654'])]) == [['123', '321'], ['456', '654']]"},
    {"setup": "",
     "check": "groupByDigitFreq(['111']) == [['111']]"},
]

# 118: Group by vowel signature (L5, replace old testCases)
TESTS[118] = [
    {"setup": "",
     "check": "sorted([sorted(g) for g in groupByVowels(['hello', 'hallo', 'help'])]) == [['hallo'], ['hello'], ['help']]"},
]

# 119: Group by digit sum (L5, replace old testCases)
TESTS[119] = [
    {"setup": "",
     "check": "sorted([sorted(g) for g in groupByDigitSum([12, 21, 33, 15])]) == [[12, 21], [15, 33]]"},
]

# Drills that have NO test cases (keep token matching)
SKIP_DRILLS = {54, 57, 62, 89, 90, 103, 109}

# === Expected code fixes ===
# Drill 85: operator precedence bug: n & (n-1) == 0 → (n & (n-1)) == 0
FIX_85 = "is_power = (n & (n - 1)) == 0 and n > 0"
# Drill 99: handle empty slopes dict
FIX_99_LINE = "        best = max(best, max(slopes.values()) + 1)"
FIX_99_REPL = "        if slopes:\n            best = max(best, max(slopes.values()) + 1)"
# Drill 104: missing return statement
FIX_104_APPEND = "\n    return list(result)"


def run_test(expected_code, setup, check):
    """Mimic the Pyodide worker snippet test flow."""
    ns = {}
    
    # 1. Execute setup
    if setup:
        exec(setup, ns)
    
    # 2. Try to compile — detect bare returns via SyntaxError
    needs_wrapping = False
    try:
        compile(expected_code, '<test>', 'exec')
    except SyntaxError as e:
        if 'return' in str(e).lower():
            needs_wrapping = True
        else:
            raise
    
    # 3. Execute user code
    if needs_wrapping:
        # Collect setup variable names to declare global (avoids UnboundLocalError)
        global_vars = [k for k in ns.keys() if not k.startswith('_') and k != '__builtins__']
        global_decl = f"    global {', '.join(global_vars)}\n" if global_vars else ""
        
        lines = expected_code.split('\n')
        indented = '\n'.join('    ' + l for l in lines)
        wrapped = f"def _user_fn():\n{global_decl}{indented}\n"
        exec(wrapped, ns)
        ns['_result'] = ns['_user_fn']()
    else:
        exec(expected_code, ns)
    
    # 4. Evaluate check
    passed = bool(eval(check, ns))
    return passed


def main():
    with open(DRILLS_PATH) as f:
        drills = json.load(f)
    
    print(f"Loaded {len(drills)} drills")
    
    # Apply expected code fixes
    drills[85]['expectedCode'] = FIX_85
    drills[99]['expectedCode'] = drills[99]['expectedCode'].replace(FIX_99_LINE, FIX_99_REPL)
    drills[104]['expectedCode'] += FIX_104_APPEND
    
    # Validate and add test cases
    failures = []
    added = 0
    
    for idx in range(len(drills)):
        if idx in SKIP_DRILLS:
            continue
        
        if idx not in TESTS:
            print(f"  WARNING: Drill {idx} ({drills[idx]['title']}) has no test cases and is not in SKIP list")
            continue
        
        test_cases = TESTS[idx]
        expected_code = drills[idx]['expectedCode']
        
        for tc_idx, tc in enumerate(test_cases):
            try:
                passed = run_test(expected_code, tc['setup'], tc['check'])
                if not passed:
                    failures.append(f"  FAIL: Drill {idx} ({drills[idx]['title']}) test {tc_idx}: check returned False")
                    print(f"  FAIL: Drill {idx} test {tc_idx}: check returned False")
            except Exception as e:
                failures.append(f"  ERROR: Drill {idx} ({drills[idx]['title']}) test {tc_idx}: {e}")
                print(f"  ERROR: Drill {idx} ({drills[idx]['title']}) test {tc_idx}: {e}")
        
        # Add test cases to drill
        drills[idx]['testCases'] = test_cases
        added += 1
    
    print(f"\nAdded test cases to {added} drills")
    print(f"Skipped {len(SKIP_DRILLS)} drills (token matching fallback)")
    
    if failures:
        print(f"\n{len(failures)} FAILURES:")
        for f in failures:
            print(f)
        print("\nFix failures before writing to drills.json")
        sys.exit(1)
    else:
        print("\nAll tests passed! Writing updated drills.json...")
        with open(DRILLS_PATH, 'w') as f:
            json.dump(drills, f, indent=2, ensure_ascii=False)
        print("Done!")


if __name__ == '__main__':
    main()
