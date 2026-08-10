const modal = document.getElementById('modal');
const openBtn = document.getElementById('openFormBtn');
const closeBtn = document.getElementById('closeFormBtn');
openBtn.addEventListener('click', () => {
  modal.showModal();
});
closeBtn.addEventListener('click', () => {
  modal.close();
});