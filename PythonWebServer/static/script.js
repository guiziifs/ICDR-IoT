let socket;

const ipInput = document.getElementById("ip-input");

// ----------------
// BOTÃO DE CONEXÃO 
// ----------------
document.getElementById("connect").onclick = () => {
  // Se já existe uma conexão ativa, desconecta antes de criar outra
  if (socket && socket.connected) {
    console.log("[DEBUG] Já existe uma conexão ativa. Desconectando...");
    socket.emit("disconnect_esp");
    socket.disconnect();
  }

  // Cria nova conexão com o servidor
  socket = io({ reconnection: false });

  // Limpa ouvintes antigos
  socket.off("connect");
  socket.off("server_response");
  socket.off("disconnect");

  socket.on("connect", () => {
    socket.emit("connect_to_esp", { ip: ipInput.value });
  });

  socket.on("server_response", (msg) => {
    // Remove quebras de linha CR
    msg = msg.replace(/\r/g, "").replace(/\x08/g, '');

    // Atualiza a área do histórico
    const history = $("#history");
    history.append(msg);
    $(".terminal").scrollTop($(".terminal")[0].scrollHeight);

    // Mantém o input no final do terminal
    keepInputAtEnd();
  });
};

// --------------------
// BOTÃO DESCONECTAR
// --------------------
document.getElementById("disconnect").onclick = () => {
  if (socket) socket.emit("disconnect_esp");
};

// --------------------
// TERMINAL INTERATIVO
// --------------------
$(function () {
  $(".terminal").on("click", function () {
    $("#input").focus();
  });

  $("#input").on("keydown", function (e) {
    if (!socket || !socket.connected) return;

    if (e.key === "Enter") {
      e.preventDefault();
      const cmd = $(this).val();

      if (cmd) {
        // envia o comando completo
        sendCommand(cmd);
        // mostra localmente o comando digitado
        $("#history").append(cmd + "\r\n");
      } else {
        // envia apenas Enter (CR) quando input vazio
        sendCommand("\r");
      }

      // limpa o input
      $(this).val("");
      keepInputAtEnd();
    }
  });
});

function sendCommand(cmd) {
  if (!socket || !socket.connected) return;
  socket.emit("send_command", cmd);
}

function log(msg) {
  $("#history").append(msg + "<br/>");
  $(".terminal").scrollTop($(".terminal")[0].scrollHeight);
}

// --------------------
// Mantém o input na última linha do terminal
// --------------------
function keepInputAtEnd() {
  const terminal = $(".terminal");
  const input = $("#input");

  // Move o input sempre para o final do terminal
  input.detach().appendTo(terminal);
  input.focus();
}
