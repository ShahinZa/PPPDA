const App = {
  appName: "UWCHAIN",
  loading: false,
  contracts: {},
  accessKey: "hashofthepassword",

  load: async () => {
    await App.loadWeb3();
    await App.loadAccount();
    await App.loadContract();
    await App.render();
    //await App.encrypt();
  },
  loadWeb3: async () => {
    if (typeof web3 !== "undefined") {
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      window.alert("Please connect to Metamask.");
    }
    // Modern dapp browsers...
    if (window.ethereum) {
      window.web3 = new Web3(ethereum);
      try {
        // Request account access if needed
        await ethereum.enable();
        // Acccounts now exposed
        web3.eth.sendTransaction({
          /* ... */
        });
      } catch (error) {
        // User denied account access...
      }
      console.log("web3 loaded.");
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = web3.currentProvider;
      window.web3 = new Web3(web3.currentProvider);
      // Acccounts always exposed
      web3.eth.sendTransaction({
        /* ... */
      });
    }
    // Non-dapp browsers...
    else {
      console.log(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
    }
  },

  loadAccount: async () => {
    // Set the current blockchain account
    App.account = web3.eth.accounts[0];
    web3.eth.defaultAccount = App.account;
  },

  loadContract: async () => {
    // Create a JavaScript version of the smart contract
    const privacyPreservingDelivery = await $.getJSON(
      "PrivacyPreservingDelivery.json"
    );
    App.contracts.PrivacyPreservingDelivery = TruffleContract(
      privacyPreservingDelivery
    );
    App.contracts.PrivacyPreservingDelivery.setProvider(App.web3Provider);

    // Hydrate the smart contract with values from the blockchain
    App.privacyPreservingDelivery =
      await App.contracts.PrivacyPreservingDelivery.deployed();

    App.contractAddress = App.privacyPreservingDelivery.address;
  },

  render: async () => {
    // Prevent double render
    if (App.loading) {
      return;
    }

    // Update app loading state
    App.setLoading(true);

    // Render Account
    $("#account").html(App.account);
    $("#contact").html(App.contractAddress);
    $("#revealBtn").on("click", App.revealAddress);
    $("#commitBtn").on("click", App.commitAddress);
    $("#commitBtn").on("click", App.encryptionDetail);
    $("#addagentBtn").on("click", App.addAgent);
    $("#appname").text(App.appName);
    $("#appnametwo").text(App.appName);
    // Update loading state
    App.setLoading(false);
  },

  setLoading: (boolean) => {
    App.loading = boolean;
  },

  getOrdernumber: async () => {
    const orderID = await App.privacyPreservingDelivery.getOrdernumber();
    console.log(orderID.c[0]);
    if (typeof orderID.c[0] == "number" && orderID.c[0] > 0) {
      $("#revealQRcode").html(
        "<p class='bg-light text-uppercase text-danger rounded'>Send it to the agent!</p>"
      );
      new QRCode("revealQRcode", {
        text: `http://localhost:3000/agent.html?${orderID}`,
        width: 256,
        height: 256,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H,
      });
    }
  },

  addAgent: async () => {
    const agentAddress = $("#inputAgent").val();
    await App.privacyPreservingDelivery.addAgent(agentAddress);
    App.getOrdernumber();
  },

  revealAddress: async () => {
    let revealedAddress = await App.privacyPreservingDelivery.revealAddress();
    $("#revealedhash").addClass(
      "bg-success text-white text-center rounded p-3 mb-5"
    );
    $("#revealedhash").html(
      `<b>Encrypted</b> 🔐: ${revealedAddress.logs[0].args.stepReveal}`
    );
    const decrypted = CryptoJS.AES.decrypt(
      revealedAddress.logs[0].args.stepReveal,
      App.accessKey
    );
    const text = decrypted.toString(CryptoJS.enc.Utf8);
    $("#revealSection").text(text);
  },

  commitAddress: async () => {
    const name = CryptoJS.AES.encrypt(
      $("#inputName").val(),
      App.accessKey
    ).toString();
    const lastname = CryptoJS.AES.encrypt(
      $("#inputPhone").val(),
      App.accessKey
    ).toString();
    const country = CryptoJS.AES.encrypt(
      $("#inputCountry").val(),
      App.accessKey
    ).toString();
    const province = CryptoJS.AES.encrypt(
      $("#inputProvince").val(),
      App.accessKey
    ).toString();
    const city = CryptoJS.AES.encrypt(
      $("#inputCity").val(),
      App.accessKey
    ).toString();
    const postalcode = CryptoJS.AES.encrypt(
      $("#inputPostalcode").val(),
      App.accessKey
    ).toString();
    const result = await App.privacyPreservingDelivery.commitAddresses(
      country,
      province,
      city,
      postalcode,
      name,
      lastname
    );
    if (result.logs[0].args.result) {
      $("#commitResultStatus").addClass(
        "bg-success text-white text-center rounded p-3 mb-5"
      );
      $("#commitResultStatus").text("Commit was successful! 🎉");
    }
  },
  encryptionDetail: async () => {
    $("#commitBtn").addClass("disabled");
    const name = CryptoJS.AES.encrypt($("#inputName").val(), App.accessKey);
    $("#NameKey").text(name.key.toString());
    $("#NameIv").text(name.iv.toString());
    $("#NameSalt").text(name.salt.toString());
    $("#NameCipher").text(name.ciphertext.toString());
    const lastname = CryptoJS.AES.encrypt(
      $("#inputPhone").val(),
      App.accessKey
    );
    $("#PhoneKey").text(lastname.key.toString());
    $("#PhoneIv").text(lastname.iv.toString());
    $("#PhoneSalt").text(lastname.salt.toString());
    $("#PhoneCipher").text(lastname.ciphertext.toString());
    const country = CryptoJS.AES.encrypt(
      $("#inputCountry").val(),
      App.accessKey
    );
    $("#CountryKey").text(country.key.toString());
    $("#CountryIv").text(country.iv.toString());
    $("#CountrySalt").text(country.salt.toString());
    $("#CountryCipher").text(country.ciphertext.toString());
    const province = CryptoJS.AES.encrypt(
      $("#inputProvince").val(),
      App.accessKey
    );
    $("#ProvinceKey").text(province.key.toString());
    $("#ProvinceIv").text(province.iv.toString());
    $("#ProvinceSalt").text(province.salt.toString());
    $("#ProvinceCipher").text(province.ciphertext.toString());
    const city = CryptoJS.AES.encrypt($("#inputCity").val(), App.accessKey);
    $("#CityKey").text(city.key.toString());
    $("#CityIv").text(city.iv.toString());
    $("#CitySalt").text(city.salt.toString());
    $("#CityCipher").text(city.ciphertext.toString());
    const postalcode = CryptoJS.AES.encrypt(
      $("#inputPostalcode").val(),
      App.accessKey
    );
    $("#PostalKey").text(postalcode.key.toString());
    $("#PostalIv").text(postalcode.iv.toString());
    $("#PostalSalt").text(postalcode.salt.toString());
    $("#PostalCipher").text(postalcode.ciphertext.toString());
  },
};

$(() => {
  $(window).load(() => {
    App.load();
    console.log("App started.");
  });
});
