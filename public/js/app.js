const changeLanguage = (language) => {
  $('#language-popup').modal('toggle');
  console.log(language);
  setLanguage(language);
  if (lang === 'he') {
    document.body.setAttribute('dir', 'rtl');
    if (!document.getElementById('aboutP1').classList.contains('text-right')) {
      document.getElementsByTagName('H3')[0].classList.toggle('text-right');
      document.getElementById('aboutP1').classList.toggle('text-right');
      document.getElementById('aboutP2').classList.toggle('text-right');
      document.getElementById('aboutP3').classList.toggle('text-right');
    }
  }
  else {
    if (lang === 'en') {
      document.body.setAttribute('dir', 'ltr');
      if (document.getElementById('aboutP1').classList.contains('text-right')) {
        document.getElementsByTagName('H3')[0].classList.toggle('text-right');
        document.getElementById('aboutP1').classList.toggle('text-right');
        document.getElementById('aboutP2').classList.toggle('text-right');
        document.getElementById('aboutP3').classList.toggle('text-right');
      }
    }
  }
};