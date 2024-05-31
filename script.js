import {
    db,
    collection,
    addDoc,
    getDocs,
    onSnapshot,
    auth,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut
  } from "./firebase.js";
  
  const formCadastro = document.getElementById("formC");
  const formLogin = document.getElementById("formL");
  const formEsqueci = document.getElementById("formE");
  
  if (formCadastro != null) {
    formCadastro.onsubmit = async (event) => {
      event.preventDefault();
  
      let dados = {
        nome: document.getElementById("fullname").value,
        user: document.getElementById("username").value,
        email: document.getElementById("email").value,
        senha: document.getElementById("password").value,
      };
  
      try {
        //   await addDoc(collection(db, "videocall"), {
        //     nome: dados.nome,
        //     email: dados.email,
        //     senha: dados.senha,
        //   });
  
        await createUserWithEmailAndPassword(auth, dados.email, dados.senha);
  
        alert("Usuário cadastrado com sucesso!");
        location.href = "index.html";
      } catch (error) {
        console.error("Error adding document: ", error);
      }
    };
  }
  
  if (formLogin != null) {
    formLogin.onsubmit = async (event) => {
      event.preventDefault();
  
      let items = [];
      let login = false;
  
      let input = {
        email: document.getElementById("login1").value,
        senha: document.getElementById("senha1").value,
      };
  
      try {
        await signInWithEmailAndPassword(auth, input.email, input.senha);
        alert("Usuário logado com sucesso!");
        location.href = "home.html";
      } catch (error) {
        console.error("Error signing in: ", error);
        alert("Usuário ou senha inválidos!");
      }
  
      // const querySnapshot = await getDocs(collection(db, "videocall"));
  
      // querySnapshot.forEach((doc) => {
      //   items.push({
      //     id: doc.id,
      //     ...doc.data(),
      //   });
      // });
  
      // for (let i = 0; i < items.length; i++) {
      //   if (items[i].email === input.email && items[i].senha === input.senha) {
      //     login = true;
      //     location.href = "home.html";
      //     break;
      //   } else {
      //     login = false;
      //   }
      // }
  
      // if (login === true) {
      //   alert("Usuário logado com sucesso!");
      // } else {
      //   alert("Usuário ou senha inválidos!");
      // }
    };
  }
  
  if (formEsqueci != null) {
    formEsqueci.onsubmit = async (event) => {
      event.preventDefault();
  
      const email = document.getElementById("emailEsqueci").value;
  
      try {
        // Enviar e-mail para redefinir a senha
        await sendPasswordResetEmail(auth, email);
  
        alert("Um e-mail foi enviado para redefinir a senha!");
        // Redirecionar para a página de login ou outra página após enviar o e-mail
        location.href = "index.html"; // ou a página que deseja redirecionar
      } catch (error) {
        console.error("Error sending password reset email: ", error);
        alert("Erro ao enviar o e-mail para redefinir a senha!");
      }
    };
  }
  
  function logoutUser() {
    auth.signOut().then(() => {
      alert("Usuário deslogado com sucesso!");
      location.href = "index.html"; 
    }).catch((error) => {
      console.error("Error signing out: ", error);
      alert("Erro ao deslogar o usuário!");
    });
  }
  
  const logoutButton = document.getElementById("logout"); 
  
  if (logoutButton != null) {
    logoutButton.addEventListener("click", () => {
      logoutUser(); 
    });
  }