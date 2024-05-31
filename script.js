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
    onAuthStateChanged
  } from "./firebase.js";
  
  const formCadastro = document.getElementById("formC");
  const formLogin = document.getElementById("formL");
  const formEsqueci = document.getElementById("formE");
  const formTransferencia = document.getElementById("formTransferencia");
  const saldoElement = document.getElementById("saldo");
  const tipoDestinatario = document.getElementById("tipoDestinatario");
  const destinatarioInput = document.getElementById("destinatario");
  let currentUser;
  
  // Listener para mudanças na autenticação
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      updateSaldo();
    } else {
      currentUser = null;
      saldoElement.textContent = "0.00";
    }
  });
  
  async function updateSaldo() {
    if (currentUser) {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        saldoElement.textContent = userData.saldo.toFixed(2);
      }
    }
  }
  
  if (formCadastro !== null) {
    formCadastro.onsubmit = async (event) => {
      event.preventDefault();
  
      let dados = {
        nome: document.getElementById("fullname").value,
        user: document.getElementById("username").value,
        email: document.getElementById("email").value,
        senha: document.getElementById("password").value,
        saldo: 27000.00,
      };
  
      try {
        // Verificar se o username já existe
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("user", "==", dados.user));
        const querySnapshot = await getDocs(q);
  
        if (!querySnapshot.empty) {
          alert("Nome de usuário já existe. Por favor, escolha outro.");
          return;
        }
  
        // Criar o usuário no Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, dados.email, dados.senha);
        const user = userCredential.user;
  
        // Adicionar o usuário ao Firestore
        await addDoc(usersRef, {
          uid: user.uid,
          nome: dados.nome,
          user: dados.user,
          email: dados.email,
          saldo: dados.saldo,
        });
  
        alert("Usuário cadastrado com sucesso!");
        location.href = "index.html";
      } catch (error) {
        console.error("Erro ao cadastrar usuário: ", error);
        alert("Erro ao cadastrar usuário: " + error.message);
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
        const userCredential = await signInWithEmailAndPassword(auth, input.email, input.senha);
        currentUser = userCredential.user;
        await updateSaldo();
        alert("Usuário logado com sucesso!");
        location.href = "home.html";
      } catch (error) {
        console.error("Erro ao fazer login: ", error);
        alert("Usuário ou senha inválidos!");
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
        location.href = "index.html";
      } catch (error) {
        console.error("Erro ao enviar e-mail de redefinição de senha: ", error);
        alert("Erro ao enviar o e-mail para redefinir a senha!");
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
  
  if (formTransferencia !== null) {
    formTransferencia.onsubmit = async (event) => {
      event.preventDefault();
  
      const tipo = tipoDestinatario.value;
      const destinatario = destinatarioInput.value;
      const quantia = parseFloat(document.getElementById("quantia").value);
  
      if (quantia <= 0) {
        alert("Por favor, insira uma quantia válida.");
        return;
      }
  
      try {
        if (!currentUser) {
          throw new Error("Usuário não autenticado.");
        }
  
        // Verificar saldo do usuário atual
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        console.log(userDoc);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.saldo < quantia) {
            alert("Saldo insuficiente.");
            return;
          }
  
          if (tipo === "usuario") {
            // Transferência para usuário
            const q = query(collection(db, "users"), where("user", "==", destinatario));
            const querySnapshot = await getDocs(q);
  
            if (querySnapshot.empty) {
              alert("Usuário destinatário não encontrado.");
              return;
            }
  
            const destinatarioDoc = querySnapshot.docs[0];
            const destinatarioData = destinatarioDoc.data();
  
            // Atualizar saldo do usuário destinatário
            const novoSaldoDestinatario = destinatarioData.saldo + quantia;
            await updateDoc(doc(db, "users", destinatarioDoc.id), {
              saldo: novoSaldoDestinatario,
            });
          }
  
          // Atualizar saldo do usuário atual
          const novoSaldo = userData.saldo - quantia;
          await updateDoc(doc(db, "users", currentUser.uid), {
            saldo: novoSaldo,
          });
  
          await updateSaldo();
  
          alert("Transferência realizada com sucesso!");
        } else {
          alert("Usuário atual não encontrado.");
        }
      } catch (error) {
        console.error("Erro ao realizar transferência: ", error);
        alert("Erro ao realizar transferência: " + error.message);
      }
    };
  }
  
  
  function logoutUser() {
    signOut(auth)
      .then(() => {
        alert("Usuário deslogado com sucesso!");
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

  