import {
  db,
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  doc,
  auth,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateDoc,
  onAuthStateChanged,
} from "./firebase.js";

const formCadastro = document.getElementById("formC");
const formLogin = document.getElementById("formL");
const formEsqueci = document.getElementById("formE");
const formTransferencia = document.getElementById("formTransferencia");
const saldoElement = document.getElementById("saldo");
const quantia = document.getElementById("quantia");
const tipoDestinatario = document.getElementById("tipoDestinatario");
const tipoTransferencia = document.getElementById("tipoTransferencia");
const destinatarioInput = document.getElementById("destinatario");
const participantes = document.getElementById("usuariosParticipantes");
let listaUsers = [];
const add = document.getElementById("adicionarUser");
let currentUser;

if (formCadastro !== null) {
  formCadastro.onsubmit = async (event) => {
    event.preventDefault();

    let dados = {
      nome: document.getElementById("fullname").value,
      user: document.getElementById("username").value,
      email: document.getElementById("email").value,
      senha: document.getElementById("password").value,
      saldo: 27000.0,
    };

    try {
      // Verificar se o username já existe
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("user", "==", dados.user));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        document.getElementById("username").style.border = "1px solid red";
        document.getElementById("userErro").innerText =
          "Nome de usuário já existe. Por favor, escolha outro.";
        return;
      }

      // Criar o usuário no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        dados.email,
        dados.senha
      );
      const user = userCredential.user;

      // Adicionar o usuário ao Firestore
      await addDoc(usersRef, {
        uid: user.uid,
        nome: dados.nome,
        user: dados.user,
        email: dados.email,
        saldo: dados.saldo,
      });

      location.href = "index.html";
    } catch (error) {
      console.error("Erro ao cadastrar usuário: ", error);
      document.getElementById("userErro").innerText =
        "Erro ao cadastrar usuário: " + error.message;
    }
  };
}

if (formLogin !== null) {
  formLogin.onsubmit = async (event) => {
    event.preventDefault();

    let input = {
      email: document.getElementById("login1").value,
      senha: document.getElementById("senha1").value,
    };

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        input.email,
        input.senha
      );
      currentUser = userCredential.user;
      location.href = "home.html";
    } catch (error) {
      console.error("Erro ao fazer login: ", error);
      document.getElementById("userErro").innerText =
        "Usuário ou senha inválidos!";
    }
  };
}

if (formEsqueci !== null) {
  formEsqueci.onsubmit = async (event) => {
    event.preventDefault();

    const email = document.getElementById("emailEsqueci").value;

    try {
      await sendPasswordResetEmail(auth, email);
      alert("Um e-mail foi enviado para redefinir a senha!");
      document.getElementById("userInst").innerText =
        "Um e-mail foi enviado para redefinir a senha!";
      location.href = "index.html";
    } catch (error) {
      console.error("Erro ao enviar e-mail de redefinição de senha: ", error);
      document.getElementById("userErro").innerText =
        "Erro ao enviar o e-mail para redefinir a senha!";
    }
  };
}

tipoDestinatario.addEventListener("change", () => {
  if (tipoDestinatario.value === "banco") {
    destinatarioInput.disabled = true;
    destinatarioInput.value = "";
  } else {
    destinatarioInput.disabled = false;
  }
});

tipoTransferencia.addEventListener("change", () => {
  if (tipoTransferencia.value === "receber") {
    destinatarioInput.disabled = true;
    tipoDestinatario.disabled = true;
    destinatarioInput.value = "";
  } else {
    destinatarioInput.disabled = false;
    tipoDestinatario.disabled = false;
  }
});

if (formTransferencia !== null) {
  formTransferencia.onsubmit = async (event) => {
    event.preventDefault();

    const valor = parseFloat(quantia.value);

    try {
      // Pegar o usuário atual
      const user = auth.currentUser;

      if (!user) {
        document.getElementById("userErro").innerText =
          "Nenhum usuário logado.";
        return;
      }

      // Acessar a coleção de usuários
      const usersRef = collection(db, "users");

      // Obter o documento do usuário logado
      const q = query(usersRef, where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        document.getElementById("userErro").innerText =
          "Usuário não encontrado no banco de dados.";
        return;
      }

      // Assumimos que há apenas um documento por usuário
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      // Pegar o saldo atual do usuário
      const saldo = userData.saldo;

      // Calcular o novo saldo do usuário logado
      let novoSaldo;
      if (tipoTransferencia.value === "receber") {
        novoSaldo = saldo + valor;
      } else {
        novoSaldo = saldo - valor;
      }

      if (novoSaldo < 0) {
        document.getElementById("userErro").innerText = "Saldo insuficiente.";
        return;
      }

      // Atualizar o saldo no Firestore do usuário logado
      const userDocRef = doc(db, "users", userDoc.id);
      await updateDoc(userDocRef, {
        saldo: novoSaldo,
      });

      // Se o tipo de transferência é "enviar", atualizar o saldo do destinatário
      if (
        tipoTransferencia.value === "pagar" &&
        tipoDestinatario.value === "usuario"
      ) {
        const destinatarioUser = destinatarioInput.value;

        // Obter o documento do destinatário
        const qDestinatario = query(
          usersRef,
          where("user", "==", destinatarioUser)
        );
        const querySnapshotDestinatario = await getDocs(qDestinatario);

        if (querySnapshotDestinatario.empty) {
          document.getElementById("userErro").innerText =
            "Destinatário não encontrado no banco de dados.";
          return;
        }

        // Assumimos que há apenas um documento por usuário
        const destinatarioDoc = querySnapshotDestinatario.docs[0];
        const destinatarioData = destinatarioDoc.data();

        if (destinatarioData.uid === user.uid) {
          document.getElementById("userErro").innerText =
            "Destinatário não pode ser o usuário atual.";
          setTimeout(() => {
            document.getElementById("userErro").style.display = "none";
          }, 5000);
          quantia.value = "";
          destinatarioInput.value = "";
          return;
        } else {
          // Calcular o novo saldo do destinatário
          const novoSaldoDestinatario = destinatarioData.saldo + valor;

          // Atualizar o saldo no Firestore do destinatário
          const destinatarioDocRef = doc(db, "users", destinatarioDoc.id);
          await updateDoc(destinatarioDocRef, {
            saldo: novoSaldoDestinatario,
          });
        }
      }

      // Atualizar o saldo na interface do usuário
      saldoElement.innerText = novoSaldo.toFixed(2);
      document.getElementById("userInst").innerText =
        "Transferência realizada com sucesso!";

      setTimeout(() => {
        document.getElementById("userInst").style.display = "none";
      }, 5000);

      // Limpar os campos de entrada após a transferência
      quantia.value = "";
      destinatarioInput.value = "";
    } catch (error) {
      console.error("Erro ao realizar transferência: ", error);
      document.getElementById("userErro").innerText =
        "Erro ao realizar transferência: " + error.message;
    }
  };
}

async function carregarUsuario(user) {
  try {
    // Acessar a coleção de usuários
    const usersRef = collection(db, "users");

    // Obter o documento do usuário logado
    const q = query(usersRef, where("uid", "==", user.uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      alert("Usuário não encontrado no banco de dados.");
      return;
    }

    // Assumimos que há apenas um documento por usuário
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    // Pegar o saldo atual do usuário
    const saldo = userData.saldo;

    // Atualizar o saldo na interface do usuário
    const saldoElement = document.getElementById("saldo");
    if (saldoElement) {
      saldoElement.innerText = saldo.toFixed(2);
    }

    // Atualizar o nome do usuário na interface
    const usuarioNameElement = document.getElementById("usuarioName");
    if (usuarioNameElement) {
      usuarioNameElement.innerText = "Nome de usuário: " + userData.user;
    }
  } catch (error) {
    console.error("Erro ao carregar o saldo: ", error);
    alert("Erro ao carregar o saldo: " + error.message);
  }
}

window.onload = (event) => {
  if (window.location.pathname.endsWith("home.html")) {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        carregarUsuario(user);
      } else {
        alert("Nenhum usuário logado. Redirecionando para a página de login.");
        location.href = "index.html";
      }
    });

  }
};

if (add !== null) {
  add.addEventListener("click", () => {
    listaUsers.push(participantes.value);
    destinatarioInput.setAttribute("value", listaUsers);
  });
}


function logoutUser() {
  signOut(auth)
    .then(() => {
      location.href = "index.html";
    })
    .catch((error) => {
      console.error("Erro ao deslogar usuário: ", error);
      alert("Erro ao deslogar o usuário!");
    });
}

const logoutButton = document.getElementById("logout");

if (logoutButton !== null) {
  logoutButton.addEventListener("click", () => {
    logoutUser();
  });
}
