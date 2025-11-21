const Delay = async (time = 100) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve("ok");
    }, time);
  });

module.exports = Delay;
