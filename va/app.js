var active = true

function playAudio(){
  const x = document.getElementById("myAudio");
  if(active){
    document.getElementById('face').innerHTML = '<img src="img/mikelObert.gif" height="150" width="150">'
    x.play()
    active = false
  }else{
    x.pause()
    active = true
    document.getElementById('face').innerHTML = '<img src="img/mikelTancat.gif" height="150" width="150">'
  }
}

function endSound(){
    document.getElementById('face').innerHTML = '<img src="img/mikelTancat.gif" height="150" width="150">'
}
