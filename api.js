const { default: axios } = require("axios");
const { env } = require("node:process");

class Api {
  constructor() {}

  static async getKecamatan() {
    try {
      const response = await axios.get(env.BASE_URL.concat("getkecamatan"));
      return response.data;
    } catch (error) {
      return [];
    }
  }

  static async getKelurahan(slug) {
    try {
      const response = await axios.get(
        env.BASE_URL.concat("getkelurahan/").concat(slug)
      );
      return response.data;
    } catch (error) {
      return [];
    }
  }

  static async getAcara() {
    try {
      const response = await axios.get(env.BASE_URL.concat("list-acara"));
      return response.data;
    } catch (error) {
      return [];
    }
  }

  static async saveAbsen(data) {
    try {
      let response = await axios.post(env.BASE_URL.concat("absen"), data);
      return response.status == 200 ? true : false;
    } catch (error) {
      return false;
    }
  }

  static logMessage(type) {
    switch (type) {
      case "qr":
        return "QR Code siap digunakan, silahkan scan dengan whatsapp pada handphone anda!";
      case "ready":
        return "Bot whatsapp siap digunakan";
      case "message":
        return "Mendapat pesan baru / mengirim pesan baru";
      case "disconnected":
        return "Bot whatsapp terputus";
      default:
        return "Connecting";
    }
  }

  static async sendLOg(type, qr = null) {
    let data = {
      type: type,
      message: this.logMessage(type),
      qr: qr,
    };
    try {
      let response = await axios.post(env.BASE_URL.concat("absen"), data);
      return response.status == 200 ? true : false;
    } catch (error) {
      return false;
    }
  }
}

module.exports = Api;
