"""Check the behavior of the maintained review fixtures, not reviewer quality.

Run only against this repository's trusted cases.md; its Python blocks execute.
Reviewer evaluations receive cases.md without this answer key.
"""

from decimal import Decimal, ROUND_HALF_EVEN, localcontext
from pathlib import Path
import re
import unittest


CASES = dict(re.findall(r"^## ([A-H])\n(.*?)(?=^## |\Z)",
                        Path(__file__).with_name("cases.md").read_text(encoding="utf-8"),
                        re.MULTILINE | re.DOTALL))


def blocks(case):
    return re.findall(r"```python\n(.*?)```", CASES[case], re.DOTALL)


def namespace(*sources, **injected):
    scope = dict(injected)
    for source in sources:
        exec(compile(source, "<review-fixture>", "exec"), scope)
    return scope


class ScenarioBehavior(unittest.TestCase):
    def test_a_public_route_is_missing_despite_direct_success(self):
        source = blocks("A")
        scope = namespace(source[0], source[1])
        self.assertEqual(scope["cancel"](), {"cancelled": True})
        self.assertEqual(scope["handle"]("POST", "/cancel"), (404, {}))

    def test_b_requested_fix_is_incomplete_and_new_assertion_accepts_it(self):
        before, after, _, _ = blocks("B")
        user, document = {"id": 2, "role": "member"}, {"owner_id": 1}
        self.assertTrue(namespace(before)["can_read"](user, document))
        result = namespace(after)["can_read"](user, document)
        self.assertTrue(result)
        self.assertIsInstance(result, bool)

    def test_c_actual_client_has_no_requested_method(self):
        client, welcome = blocks("C")
        scope = namespace(client, welcome.replace("from mail_client import Client\n", ""))
        with self.assertRaises(AttributeError):
            scope["welcome"]("user@example.test")

    def test_d_failed_save_is_reported_as_success(self):
        error, _, after = blocks("D")
        scope = namespace(error, after)

        class Store:
            def write(self, value):
                raise scope["StorageError"]("unavailable")

        self.assertEqual(scope["save"](Store(), "value"), {"saved": True})

    def test_e_changed_expectation_matches_new_contract(self):
        scope = namespace(blocks("E")[1])
        self.assertEqual(scope["search_response"]([]), (200, []))
        self.assertEqual(scope["search_response"](["a"]), (200, ["a"]))

    def test_f_fallback_is_narrow_and_required(self):
        theme_for = namespace(blocks("F")[1])["theme_for"]

        class Service:
            def __init__(self, result):
                self.result = result

            def fetch(self):
                if isinstance(self.result, Exception):
                    raise self.result
                return self.result

        self.assertEqual(theme_for(Service("dark")), "dark")
        self.assertEqual(theme_for(Service(TimeoutError())), "light")
        with self.assertRaises(ValueError):
            theme_for(Service(ValueError()))

    def test_g_rounding_differs_from_repository_policy(self):
        policy, _, after = blocks("G")
        scope = namespace(policy, after)
        prices, rate = [Decimal("0.05"), Decimal("0.05")], Decimal("0.10")
        with localcontext() as context:
            context.rounding = ROUND_HALF_EVEN
            expected = sum(scope["item_total"](price, rate) for price in prices)
            actual = scope["quote"](prices, rate)
        self.assertEqual(expected, Decimal("0.12"))
        self.assertEqual(actual, Decimal("0.11"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
