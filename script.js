// ========== User Login Logic ==========
const users = {
  admin: { password: "admin123", role: "admin" },
  user: { password: "user123", role: "user" },
};

function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const loginError = document.getElementById("login-error");

  if (users[username] && users[username].password === password) {
    const role = users[username].role;
    sessionStorage.setItem("role", role);
    document.getElementById("login-container").classList.add("hidden");
    document.getElementById("dashboard").classList.remove("hidden");
    if (role === "admin") {
      document.getElementById("admin-controls").classList.remove("hidden");
    }
    initMQTT();
  } else {
    loginError.textContent = "Invalid login credentials.";
  }
}

// ========== MQTT Logic ==========
let client;
function initMQTT() {
  const broker = "wss://io.adafruit.com:443";
  const options = {
    username: "your_username", // Replace with your Adafruit IO username
    password: "your_aio_key",  // Replace with your Adafruit IO AIO key
  };
  client = mqtt.connect(broker, options);

  client.on("connect", () => {
    console.log("MQTT connected");
    const topics = ["voltage", "current", "kwh", "tamper", "short"];
    topics.forEach((t) => client.subscribe(`your_username/feeds/${t}`));
  });

  client.on("message", (topic, message) => {
    const val = message.toString();
    if (topic.includes("voltage")) {
      document.getElementById("voltage").textContent = val;
    } else if (topic.includes("current")) {
      document.getElementById("current").textContent = val;
    } else if (topic.includes("kwh")) {
      document.getElementById("kwh").textContent = val;
      logHistory(val);
    } else if (topic.includes("tamper")) {
      document.getElementById("tamper").textContent = `Tamper: ${val}`;
    } else if (topic.includes("short")) {
      document.getElementById("short").textContent = `Short Circuit: ${val}`;
    }
  });
}

function toggleLoad(load, state) {
  client.publish(`your_username/feeds/${load}`, state);
}

function reconnectAfterTamper() {
  client.publish("your_username/feeds/tamper", "reset");
}

// ========== History Logging ==========
function logHistory(kwh) {
  const list = document.getElementById("history-list");
  const time = new Date().toLocaleString();
  const li = document.createElement("li");
  li.textContent = `${time} - ${kwh} kWh`;
  list.prepend(li);

  // Store latest 20 readings
  if (list.children.length > 20) {
    list.removeChild(list.lastChild);
  }
}
