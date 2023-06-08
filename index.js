const qrString = require("qrcode");
const qrcode = require("qrcode-terminal");
const { Client, LocalAuth, Buttons } = require("whatsapp-web.js");
const Api = require("./api");
const sendNotification = require("./notify");
const { default: axios } = require("axios");
const client = new Client({
  authStrategy: new LocalAuth(),
});

require("dotenv").config();

client.on("qr", (qr) => {
  qrString.toDataURL(qr, (err, url) => {
    Api.sendLOg("qr", qr).then((e) => console.log(e));
  });
  qrcode.generate(qr, { small: true });
  console.log("qr sent");
});

client.on("ready", () => {
  console.log("Client is ready!");
  //send log to front end
  Api.sendLOg("ready", null).then((e) => console.log(e));
});

client.initialize();

//variable & state

//var
let list_kecamatan = [];
let list_kelurahan = [];
let list_acara = [];
const availableEvents = ["Acara A", "Acara B", "Acara C"];
const userData = {
  name: "",
  phoneNumber: "",
  address: "",
};
let answer = [];

//create state
function createState(id) {
  let indexUnique = answer.findIndex((obj) => obj.chatID === id);
  if (indexUnique === -1) {
    answer.push({
      chatID: id,
      state: "",
      position: "begin",
      currentQuestion: 0,
      absenQuestion: 0,
      imageUrl: "",
      acara: "",
      nama: "",
      nik: "",
      kecamatan: "",

      kelurahan: "",
      rt: "",
      rw: "",
      no_telp: "",
    });
  }
}

//getter and setter state
function getState(id) {
  let index = answer.findIndex((obj) => obj.chatID === id);
  return answer[index] !== undefined ? answer[index] : false;
}

function setDataAbsen(index, chatID, text) {
  switch (index) {
    case 1:
      getState(chatID).acara = text;
      break;
    case 2:
      getState(chatID).nama = text;
      break;
    case 3:
      getState(chatID).alamat = text;
      break;
    case 4:
      getState(chatID).no_telp = text;
      break;
  }
}

//end variable & state

function validateAcara(text, chatID) {
  let indexAcara = !isNaN(text);
  if (indexAcara) {
    if (list_acara[text]) {
      getState(chatID).acara = list_acara[text]["title"];
      client.sendMessage(chatID, "*1. Masukkan Nama Anda :*");
      getState(chatID).absenQuestion++;
    } else {
      client
        .sendMessage(chatID, "Maaf silahkan pilih kembali acara yang tersedia")
        .then(() => {
          Api.getAcara().then((e) => {
            list_acara = e;
            client.sendMessage(
              chatID,
              e
                .map((acara, index) => index + 1 + ". " + acara["title"])
                .join("\n")
            );
          });
        });
    }
  } else {
    client
      .sendMessage(chatID, "Maaf silahkan pilih kembali acara yang tersedia")
      .then(() => {
        Api.getAcara().then((e) => {
          list_acara = e;
          client.sendMessage(
            chatID,
            e
              .map((acara, index) => index + 1 + ". " + acara["title"])
              .join("\n")
          );
        });
      });
  }
}

function saveAbsen(chatID) {
  try {
    let data = {
      acara: getState(chatID).acara,
      nama: getState(chatID).nama,
      alamat: getState(chatID).alamat,
      no_handphone: getState(chatID).no_telp,
    };
    Api.saveAbsen(data)
      .then((e) => {
        if(e){
          client
          .sendMessage(chatID, "✅ Berhasil menyimpan, terimakasih")
          .then(() => {
            sendNotification(
              "Notifikasi WhatsApp",
              `${data.nama} Berhasil absen melalui whatsapp`,
              "whatsapp",
              () => {
                getState(chatID).state = "";
                getState(chatID).absenQuestion = 0;
              }
            );
          });
        }else{
          client
          .sendMessage(chatID, "❌ Maaf terjadi kesalahan silahkan coba lagi")
          .then(() => {
            sendNotification(
              "Notifikasi WhatsApp",
              `${data.nama} Gagal absen melalui whatsapp`,
              "whatsapp",
              () => {
                getState(chatID).state = "";
                getState(chatID).absenQuestion = 0;
              }
            );
          });
        }
        
      })
      .catch((err) => {
        client
          .sendMessage(chatID, "❌ Maaf terjadi kesalahan silahkan coba lagi")
          .then(() => {
            getState(chatID).state = "";
            getState(chatID).absenQuestion = 0;
          });
      });
  } catch (error) {
    console.log(error);
  }
}

// Menangani pesan dari pengguna
client.on("message", async (message) => {
  const chatId = message.from;
  const userMessage = message.body.toLowerCase();
  createState(message.from);
  setDataAbsen(
    getState(message.from).absenQuestion,
    message.from,
    message.body
  );

  if (message.body === "/absen") {
    getState(message.from).state = "/absen";
    getState(message.from).absenQuestion = 0;
    getState(message.from).currentQuestion = 0;
  }

  if (getState(message.from).state === "/absen") {
    if (message.body === "/benar") {
      saveAbsen(message.from);
    } else if (message.body === "/ulang") {
      getState(message.from).absenQuestion = 0;
    }

    switch (getState(message.from).absenQuestion) {
      case 0:
        Api.getAcara().then((e) => {
          list_acara = e;
          client.sendMessage(
            message.from,
            e
              .map((acara, index) => index + 1 + ". " + acara["title"])
              .join("\n")
          );
        });
        getState(message.from).absenQuestion++;
        break;
      case 1:
        validateAcara(message.body, message.from);
        break;
      case 2:
        client.sendMessage(
          message.from,
          "*2. Masukkan Alamat Anda :*\nNama Jalan, RT/RW, Kelurahan"
        );
        getState(message.from).absenQuestion++;
        break;
      case 3:
        client.sendMessage(
          message.from,
          "*3. Masukkan Nomor Whatsapp :*\nNomor Tanpa Spasi"
        );
        getState(message.from).absenQuestion++;
        break;
      case 4:
        getState(message.from).position = "end";
        let string = `Acara : ${getState(message.from).acara}\nNama : ${
          getState(message.from).nama
        }\nAlamat : ${getState(message.from).alamat}\nNo Telp/Wa : ${
          getState(message.from).no_telp
        }\n`;
        client.sendMessage(
          message.from,
          "Apakah data yang dimasukan sudah benar?"
        );
        client.sendMessage(
          message.from,
          "Jika sudah balas */benar*\nJika belum balas */ulangi*"
        );
        getState(message.from).absenQuestion++;
        break;
    }
  }

  console.log(getState(message.from));
});

//Api.getKecamatan().then((e) => console.log(e));
//Api.getKelurahan('kec_panjaringan').then((e) => console.log(e));
// let data = {
//   acara: getState(chatID).acara,
//   nama: getState(chatID).nama,
//   alamat: getState(chatID).alamat,
//   no_handphone: getState(chatID).no_telp,
// };
//Api.saveAbsen().then((e) => console.log(e));
//Api.getAcara().then((e) => console.log(e));
// Api.sendLOg('qr', null).then((e)=>console.log(e))
