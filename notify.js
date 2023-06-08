const { default: axios } = require("axios");
const { env } = require("node:process");



function sendNotification(title, data, type, cb) {
  let datas = {
    title: title,
    data: data,
    type: type,
  };
  try {
    axios
      .post(env.BASE_URL.concat('notify'), datas)
      .then((e) => cb())
      .catch((err) => console.log(err));
  } catch (error) {
    console.log(error);
  }
}

module.exports = sendNotification;
