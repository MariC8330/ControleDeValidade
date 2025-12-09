// app.js
import {
    db,
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    updateDoc
  } from "./firebase.js";
  
  import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
  
  const auth = getAuth();
  const form = document.getElementById("form-produto");
  const lista = document.getElementById("lista-produtos");
  const buscaInput = document.getElementById("busca");
  const produtosRef = collection(db, "produtos");
  const botaoSair = document.getElementById("logout");
  let editandoId = null;
  
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "login.html";
    }
  });
  
  botaoSair.addEventListener("click", () => {
    signOut(auth).then(() => {
      window.location.href = "login.html";
    });
  });
  
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = document.getElementById("nome").value;
    const validade = document.getElementById("validade").value;
    const lote = document.getElementById("lote").value;
  
    if (nome && validade && lote) {
      if (editandoId) {
        const produtoRef = doc(db, "produtos", editandoId);
        await updateDoc(produtoRef, { nome, validade, lote });
        editandoId = null;
      } else {
        await addDoc(produtosRef, { nome, validade, lote });
      }
  
      form.reset();
      carregarProdutos();
    }
  });
  
  function calcularDiasRestantes(dataValidade) {
    const hoje = new Date();
    const validade = new Date(dataValidade);
    const diff = validade - hoje;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
  
  async function carregarProdutos(filtro = "") {
    lista.innerHTML = "";
    const querySnapshot = await getDocs(produtosRef);
  
    querySnapshot.forEach((docItem) => {
      const produto = docItem.data();
      const id = docItem.id;
      const dias = calcularDiasRestantes(produto.validade);
  
      if (
        produto.nome.toLowerCase().includes(filtro.toLowerCase()) ||
        produto.lote.toLowerCase().includes(filtro.toLowerCase())
      ) {
        const li = document.createElement("li");
  
        let classe = "verde";
        let alerta = "";
  
        if (dias < 0) {
          classe = "vermelho";
          alerta = `<span class='alerta'>(expirou há ${Math.abs(dias)} dias)</span>`;
        } else if (dias <= 90) {
          classe = "laranja";
          alerta = `<span class='alerta'>(faltam ${dias} dias para vencer)</span>`;
        } else if (dias <= 180) {
          classe = "amarelo";
        } else if (dias >180) {
          classe = "verde";
        }
  
        li.className = classe;
        li.innerHTML = `
          <strong>${produto.nome}</strong> - Validade: ${produto.validade} - Lote: ${produto.lote}
          ${alerta}<br>
          <button onclick="editarProduto('${id}', '${produto.nome}', '${produto.validade}', '${produto.lote}')">Editar</button>
          <button onclick="excluirProduto('${id}')">Excluir</button>
        `;
  
        lista.appendChild(li);
      }
    });
  }
  
  window.excluirProduto = async function (id) {
    await deleteDoc(doc(db, "produtos", id));
    carregarProdutos(buscaInput.value);
  };
  
  window.editarProduto = function (id, nome, validade, lote) {
    document.getElementById("nome").value = nome;
    document.getElementById("validade").value = validade;
    document.getElementById("lote").value = lote;
    editandoId = id;
  };
  
  buscaInput.addEventListener("input", () => {
    carregarProdutos(buscaInput.value);
  });
  
  carregarProdutos();
  
  setInterval(() => {
    carregarProdutos(buscaInput.value);
  }, 60000);
  