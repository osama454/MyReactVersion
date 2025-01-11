let x = {
  v: 0,
  func(v) {
    this.v = v;
  },
};

function f(x) {
  x.func(6);
}

f(x);

console.log(x);
