import {
  db,
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  updateEmail,
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
  onSnapshot,
  updateProfile,
  reauthenticateWithCredential, 
  EmailAuthProvider, 
  sendEmailVerification,
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
const logoutButton = document.getElementById("logout");
const quitButton = document.getElementById("quit");
let listaUsers = [];
const add = document.getElementById("adicionarUser");
const editProfileForm = document.getElementById("editProfileForm");
let currentUser;

function atualizarDestinatarios() {
  destinatarioInput.innerHTML =
    '<option value="0">Selecione um usuário</option>';
  listaUsers.forEach((user) => {
    const option = document.createElement("option");
    option.value = user;
    option.text = user;
    destinatarioInput.appendChild(option);
  });
}

function carregarListaDoLocalStorage() {
  const lista = localStorage.getItem("listaUsers");
  if (lista) {
    listaUsers = JSON.parse(lista);
    atualizarDestinatarios();
  }
}

if (formCadastro !== null) {
  formCadastro.onsubmit = async (event) => {
    event.preventDefault();

    let dados = {
      nome: document.getElementById("fullname").value.trim(),
      user: document.getElementById("username").value.trim(),
      email: document.getElementById("email").value.trim(),
      senha: document.getElementById("password").value.trim(),
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
        destinatarioInput.value = "0";
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
        destinatarioInput.value = "0";
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
        destinatarioInput.value = "0";
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
          destinatarioInput.value = "0";
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
          destinatarioInput.value = "0";
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
      destinatarioInput.value = "0";
    } catch (error) {
      console.error("Erro ao realizar transferência: ", error);
      document.getElementById("userErro").innerText =
        "Erro ao realizar transferência: " + error.message;
      destinatarioInput.value = "0";
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
        carregarListaDoLocalStorage();
      } else {
        alert("Nenhum usuário logado. Redirecionando para a página de login.");
        location.href = "index.html";
      }
    });
  }
};

if (add !== null) {
  add.onclick = async () => {
    const newUser = participantes.value;
    if (newUser && !listaUsers.includes(newUser)) {
      // Verifica se o nome de usuário inserido não é o mesmo que o nome de usuário do usuário logado
      if (newUser === currentUser) {
        alert("Você não pode adicionar seu próprio nome de usuário.");
        return;
      }

      try {
        const user = auth.currentUser;

        if (!user) {
          document.getElementById("userError").innerText =
            "Nenhum usuário logado.";
          return;
        }

        const userRef = collection(db, "users");
        const q = query(userRef, where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          document.getElementById("userError").innerText =
            "Usuário não encontrado no banco de dados.";
          participantes.value = "";
          return;
        }

        const destinatarioUser = participantes.value;

        // Obter o documento do destinatário
        const qDestinatario = query(
          userRef,
          where("user", "==", destinatarioUser)
        );
        const querySnapshotDestinatario = await getDocs(qDestinatario);

        if (querySnapshotDestinatario.empty) {
          document.getElementById("userError").innerText =
            "Nome de usuário não encontrado no banco de dados.";
          participantes.value = "";
          setTimeout(() => {
            document.getElementById("userError").style.display = "none";
          }, 5000);
          return;
        }

        // Assumimos que há apenas um documento por usuário
        const destinatarioDoc = querySnapshotDestinatario.docs[0];
        const destinatarioData = destinatarioDoc.data();

        if (destinatarioData.uid === user.uid) {
          document.getElementById("userError").innerText =
            "Destinatário não pode ser o usuário atual.";
          participantes.value = "";
          setTimeout(() => {
            document.getElementById("userError").style.display = "none";
          }, 5000);
          return;
        } else {
          listaUsers.push(newUser);
          localStorage.setItem("listaUsers", JSON.stringify(listaUsers));
          atualizarDestinatarios();
        }

        participantes.value = "";
      } catch (error) {
        console.error("Erro ao verificar usuário: ", error);
        alert("Erro ao verificar usuário: " + error.message);
      }
    } else {
      alert("Nome de usuário inválido ou já adicionado.");
    }
  };
}

async function carregarSaldosEmTempoReal() {
  try {
    const usersRef = collection(db, "users");

    // Verificar se há usuários na lista
    if (listaUsers.length === 0) {
      const saldosUsuarios = document.getElementById("saldosUsuarios");
      saldosUsuarios.innerHTML = ""; // Limpar os saldos existentes
      return; // Não há usuários, então não há necessidade de continuar
    }

    const usersQuery = query(usersRef, where("user", "in", listaUsers));

    // Observar os documentos dos usuários na lista em tempo real
    const unsubscribe = onSnapshot(usersQuery, (querySnapshot) => {
      const saldosUsuarios = document.getElementById("saldosUsuarios");
      saldosUsuarios.innerHTML = ""; // Limpar os saldos existentes

      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        const saldoItem = document.createElement("li");
        saldoItem.id = `saldo-${userData.user}`;
        saldoItem.innerText = `${userData.user}: R$ ${userData.saldo.toFixed(
          2
        )}`;
        saldosUsuarios.appendChild(saldoItem);
      });
    });

    return unsubscribe;
  } catch (error) {
    console.error("Erro ao carregar saldos em tempo real: ", error);
    alert("Erro ao carregar saldos em tempo real: " + error.message);
  }
}

async function exibirSaldosModal() {
  // Carregar os saldos em tempo real
  const unsubscribe = await carregarSaldosEmTempoReal();

  // Remover o ouvinte quando o modal for fechado
  const saldoModal = document.getElementById("saldoModal");
  saldoModal.addEventListener("hidden.bs.modal", () => {
    unsubscribe();
  });
}

// document.addEventListener("DOMContentLoaded", () => {
//   const showButton = document.getElementById("show");
//   if (showButton) {
//     showButton.addEventListener("click", () => {
//       exibirSaldosModal();
//     });
//   }

//   const profileIcon = document.getElementById("profileIcon");
//   const editProfileForm = document.getElementById("editProfileForm");

//   if (profileIcon) {
//     profileIcon.addEventListener("click", async () => {
//       const user = auth.currentUser;

//       if (!user) {
//         document.getElementById("userError").innerText = "Nenhum usuário logado.";
//         return;
//       }

//       const usersRef = collection(db, "users");
//       const q = query(usersRef, where("uid", "==", user.uid));
//       const querySnapshot = await getDocs(q);

//       const userDoc = querySnapshot.docs[0];
//       const userData = userDoc.data();

//       document.getElementById("username").value = userData.user;
//       document.getElementById("email").value = user.email;
//       document.getElementById("fullName").value = userData.nome;
//     });
//   }

//   if (editProfileForm) {
//     editProfileForm.onsubmit = async (e) => {
//       e.preventDefault();
//       const username = document.getElementById("username").value;
//       const email = document.getElementById("email").value;
//       const fullName = document.getElementById("fullName").value;

//       try {
//         const user = auth.currentUser;

//         if (!user) {
//           document.getElementById("userError").innerText = "Nenhum usuário logado.";
//           return;
//         }

//         console.log("Usuário logado:", user);

//         if (email !== user.email) {
//           await updateEmail(user, email);
//           console.log("Email atualizado:", email);
//         }

//         const usersRef = collection(db, "users");
//         const q = query(usersRef, where("uid", "==", user.uid));
//         const querySnapshot = await getDocs(q);

//         if (querySnapshot.empty) {
//           console.error("Nenhum documento encontrado para o usuário logado.");
//           alert("Erro: Nenhum documento encontrado para o usuário logado.");
//           return;
//         }

//         const userDoc = querySnapshot.docs[0];
//         const userDocRef = doc(db, "users", userDoc.id);

//         console.log("Documento do usuário encontrado:", userDoc.data());

//         let profileUpdated = false;
//         if (username !== user.displayName) {
//           await updateProfile(user, { displayName: username });
//           console.log("Nome de usuário atualizado no Firebase Auth:", username);
//           profileUpdated = true;
//         }

//         if (fullName !== userDoc.data().nome) {
//           console.log("Tentando atualizar nome completo no Firestore:", fullName);
//           await updateDoc(userDocRef, { nome: fullName })
//             .then(() => {
//               console.log("Nome completo atualizado no Firestore:", fullName);
//               profileUpdated = true;
//             })
//             .catch((error) => {
//               console.error("Erro ao atualizar nome no Firestore:", error);
//               alert("Erro ao atualizar nome no Firestore: " + error.message);
//             });
//         }

//         if (profileUpdated) {
//           alert("Perfil atualizado com sucesso!");

//           const usuarioNameElement = document.getElementById("usuarioName");
//           usuarioNameElement.innerText = username;
//         } else {
//           alert("Nenhuma atualização necessária.");
//         }
//       } catch (error) {
//         console.error("Erro ao atualizar perfil:", error);
//         alert("Erro ao atualizar perfil: " + error.message);
//       }
//     };
//   }
// });

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

if (logoutButton !== null) {
  logoutButton.addEventListener("click", () => {
    logoutUser();
  });
}

if (quitButton !== null) {
  quitButton.addEventListener("click", async () => {
    try {
      // Limpar a lista de usuários do localStorage
      localStorage.removeItem("listaUsers");
      listaUsers = [];
      atualizarDestinatarios();

      // Obter o usuário atual
      const user = auth.currentUser;

      if (!user) {
        document.getElementById("userError").innerText =
          "Nenhum usuário logado.";
        return;
      }

      // Acessar a coleção de usuários
      const usersRef = collection(db, "users");

      // Obter o documento do usuário logado
      const q = query(usersRef, where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        document.getElementById("userError").innerText =
          "Usuário não encontrado no banco de dados.";
        return;
      }

      // Assumimos que há apenas um documento por usuário
      const userDoc = querySnapshot.docs[0];
      const userDocRef = doc(db, "users", userDoc.id);

      // Atualizar o saldo no Firestore do usuário logado
      const novoSaldo = 27000.0;
      await updateDoc(userDocRef, {
        saldo: novoSaldo,
      });

      // Atualizar o saldo na interface do usuário
      if (saldoElement) {
        saldoElement.innerText = novoSaldo.toFixed(2);
      }

      document.getElementById("userEncerr").innerText =
        "Saldo redefinido para R$ 27000,00.";

      setTimeout(() => {
        document.getElementById("userEncerr").style.display = "none";
      }, 5000);
    } catch (error) {
      console.error("Erro ao redefinir o saldo: ", error);
      document.getElementById("userError").innerText =
        "Erro ao redefinir o saldo: " + error.message;
    }
  });
}
