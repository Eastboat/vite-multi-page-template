window.onload = () => {
  const div = document.createElement('div');

  const a1: HTMLAnchorElement = document.createElement('a');
  a1.href = 'http://localhost:3000/home';
  a1.textContent = 'Home';
  div.appendChild(a1);

  const a2: HTMLAnchorElement = document.createElement('a');
  a2.href = 'http://localhost:3000/user';
  a2.textContent = 'User';
  div.appendChild(a2);

  div.style.cssText = `width:200px;display:flex;flex-direction:column;align-items:center;justify-content:center;margin:auto;background:#eee`;

  document.body.appendChild(div);
};
