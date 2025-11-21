function pathMiddleWare(req, res, next) {
  const path = req.path;
  let method = req.method;
  let date = new Date();
  let hour = date.getHours();
  let minutes = date.getMinutes();
  let sec = date.getSeconds();
  let miliSec = date.getMilliseconds();
  let utcMiliSec = date.getUTCMilliseconds();
  let requestTime = {
    hour,
    minutes,
    sec,
    miliSec,
    utcMiliSec,
  };
  let time =
    (hour > 12 ? hour % 12 : hour) +
    ":" +
    (minutes < 10 ? "0" + minutes : minutes) +
    ":" +
    sec +
    "." +
    miliSec;
  if (path == "/favicon.ico") return next();
  console.log({ path, method, time });
  req.requestTime = requestTime;
  next();
}
function printTime(req, log = true) {
  const path = req.path;
  let method = req.method;
  let date = new Date();
  let hour = date.getHours();
  let minutes = date.getMinutes();
  let sec = date.getSeconds();
  let miliSec = date.getMilliseconds();
  let utcMiliSec = date.getUTCMilliseconds();
  let time =
    (hour > 12 ? hour % 12 : hour) +
    ":" +
    (minutes < 10 ? "0" + minutes : minutes) +
    ":" +
    sec +
    "." +
    miliSec +
    " --- time";
  if (log) console.log({ path, method, time });
  return { hour, minutes, sec, miliSec, utcMiliSec };
}
function printConsumedTime(req, text = "DB Query --") {
  let start = req.requestTime.utcMiliSec;
  let end = printTime(req, false)?.utcMiliSec;
  let { seconds, milliseconds } = diffToSecondsMillis(start, end);
  console.log(req.path, " : " ,text, ` : ${seconds}s : ${milliseconds}ms -- consumed time`);
}
function diffToSecondsMillis(startUtcMs, endUtcMs) {
  // Difference in milliseconds
  const diff = Math.abs(endUtcMs - startUtcMs);

  // Extract seconds and milliseconds
  const seconds = Math.floor(diff / 1000);
  const milliseconds = diff % 1000;

  return { seconds, milliseconds };
}

module.exports = { pathMiddleWare, printTime, printConsumedTime };
