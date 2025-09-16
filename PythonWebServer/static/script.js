let socket;

const terminal = document.getElementById("terminal");
const ipInput = document.getElementById("ip-input");
const cmdInput = document.getElementById("cmd");
const sendBtn = document.getElementById("send");

document.getElementById("connect").onclick = () => {
  socket = io();

  socket.on("connect", () => {
    log("Connected to Flask server");
    socket.emit("connect_to_esp", { ip: ipInput.value });
  });

  socket.on("server_response", (msg) => {
    terminal.textContent += msg;   // escreve direto, sem quebrar linha
    terminal.scrollTop = terminal.scrollHeight;
    });

};

function sendCommand(){
  const cmd = cmdInput.value;
  socket.emit("send_command", cmd);
  cmdInput.value = "";
}

sendBtn.onclick = sendCommand;

cmdInput.addEventListener("keypress", (event) =>{
  if(event.key == "Enter"){
    sendCommand();
  }
})

//document.getElementById("send").onclick = () => {
  //const cmd = document.getElementById("cmd").value;
  //if (cmd.trim() !== "") {
    //socket.emit("send_command", cmd);
    //document.getElementById("cmd").value = "";
  //}
//};

document.getElementById("disconnect").onclick = () => {
  socket.emit("disconnect_esp");
};

function log(msg) {
  terminal.textContent += msg + "\n";
  terminal.scrollTop = terminal.scrollHeight;
}
