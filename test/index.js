import test from "ava";
import currency from "../package/index";

test("Country code", (t) => {
  t.is(currency("SE"), "Sweden");
  t.is(currency("Nl"), "Netherlands");
  t.is(currency("dE"), "Germany");
  t.is(currency("us"), "United States of America");
  t.is(currency("AU"), "Australia");

  t.pass();
});

test("Country code in uppercase", (t) => {
  t.is(currency("SE"), "Sweden");
  t.is(currency("NL"), "Netherlands");
  t.is(currency("DE"), "Germany");
  t.is(currency("US"), "United States of America");
  t.is(currency("AU"), "Australia");

  t.pass();
});

test("Country code in lowercase", (t) => {
  t.is(currency("se"), "Sweden");
  t.is(currency("nl"), "Netherlands");
  t.is(currency("de"), "Germany");
  t.is(currency("us"), "United States of America");
  t.is(currency("au"), "Australia");

  t.pass();
});
