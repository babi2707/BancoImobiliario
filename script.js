import {
    db,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    auth,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut
  } from "./firebase.js";
  
  const formCadastro = document.getElementById("formC");
  const formLogin = document.getElementById("formL");
  const formEsqueci = document.getElementById("formE");
  
  if (formCadastro !== null) {
    formCadastro.onsubmit = async (event) => {
      event.preventDefault();
  
      let dados = {
        nome: document.getElementById("fullname").value,
        user: document.getElementById("username").value,
        email: document.getElementById("email").value,
        senha: document.getElementById("password").value
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
        await createUserWithEmailAndPassword(auth, dados.email, dados.senha);
  
        // Adicionar o usuário ao Firestore
        await addDoc(usersRef, {
          nome: dados.nome,
          user: dados.user,
          email: dados.email
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
        senha: document.getElementById("senha1").value
      };
  
      try {
        await signInWithEmailAndPassword(auth, input.email, input.senha);
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
  
  function logoutUser() {
    signOut(auth).then(() => {
      alert("Usuário deslogado com sucesso!");
      location.href = "index.html";
    }).catch((error) => {
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
  