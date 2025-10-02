let socket;

const ipInput = document.getElementById("ip-input");

document.getElementById("connect").onclick = () => {
  socket = io();

  socket.on("connect", () => {
    log("Connected to Flask server");
    socket.emit("connect_to_esp", { ip: ipInput.value });
  });

  socket.on("server_response", (msg) => {
    // escreve a resposta no histórico do terminal
    $("#history").append(msg + "<br/>");
    $(".terminal").scrollTop($(".terminal")[0].scrollHeight);
  });
};

function sendCommand(cmd) {
  if (!socket) return;
  if (cmd.trim() === "") return;
  socket.emit("send_command", cmd);
}

// desconectar
document.getElementById("disconnect").onclick = () => {
  if (socket) socket.emit("disconnect_esp");
};

function log(msg) {
  $("#history").append(msg + "<br/>");
  $(".terminal").scrollTop($(".terminal")[0].scrollHeight);
}

// --------------------
// LÓGICA DO TERMINAL NOVO
// --------------------
$(function () {
  $(".terminal").on("click", function () {
    $("#input").focus();
  });

  $("#input").on("keydown", function search(e) {
    if (e.keyCode === 13) {
      e.preventDefault();
      const cmd = $(this).val();

      if(cmd === "") {
      $("#history").append("<br/>");  
      } else {
        // mostra o comando no histórico
        $("#history").append("<span style='color:lightgreen'>" + $("#path").text() + cmd + "</span><br/>");
        $(".terminal").scrollTop($(".terminal")[0].scrollHeight);
      }

      if (socket && socket.connected) {
        // envia para o servidor
        sendCommand(cmd);
      } else {
        $("#history").append("<span style='color:orange'>[Not connected]</span><br/>");
      }

      if (cmd.substring(0, 3) === "cd ") {
        $("#path").html(cmd.substring(3) + "&nbsp;>&nbsp;");
      }

      // limpa input sempre
      $(this).val("");
    }
  });
});
