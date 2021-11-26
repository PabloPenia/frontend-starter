const menuBtn = document.querySelector('#navbar > .menuBtn')
const menuBox = document.querySelector('#navbar')

function toggleActive() {
    menuBtn.classList.toggle('active')
  if(menuBtn.classList.contains("active")) {
    document.addEventListener('mousedown', (e) => {
      if (!menuBox.contains(e.target)) menuBtn.classList.remove('active')
    })
  }
}

menuBtn.addEventListener('click', toggleActive)