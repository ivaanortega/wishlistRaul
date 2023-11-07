
const root = document.querySelector(':root');
const setVariables = vars => Object.entries(vars).forEach(v => root.style.setProperty(v[0], v[1]));

const aColor = {
    dark: {
        '--white': 'rgb(255, 255, 255)',
        '--primary': '#1a1a1a',
        '--secondary': '#414141',
        '--buttonColor': 'white',
        '--icons': 'rgb(206, 206, 206)',
        '--gray':  '#bebebe',
        '--text': 'rgb(255, 255, 255)',
        '--background': 'rgb(88, 88, 88)',
        '--box-background': '#414141'
    },
    light: {
        '--white': '#fff',
        '--primary': '#FEAF00',
        '--secondary': '#F8D442',
        '--buttonColor': 'white',
        '--gray':  '#bebebe',
        '--text': 'black',
        '--icons': 'var(--primary)',
        '--background': 'rgb(252, 245, 245)',
        '--box-background': 'white'
    },
    blue: {
        '--white': 'white',
        '--primary': '#5538fd',
        '--secondary': '#557fcd',
        '--buttonColor': 'white',
        '--gray':  '#bebebe',
        '--text': 'black',
        '--icons': 'var(--primary)',
        '--background': 'rgb(252, 245, 245)',
        '--box-background': 'white'
    }
};
 
function getColor(){
    let color = null;
    if(user != null){
        color = user['theme'];
    }
    if(color == null || color == ''){
        color = localStorage.getItem("colorTheme");
    }
    return color;
}

let c = getColor();
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    if(!c || c == 'null'){
        setColor('dark');
    }else{
        setColor(c);
    }
}else{
    if(c){
        setColor(c);
    }
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
  const newColorScheme = event.matches ? 'dark' : 'light';
  if(!c || c == 'null'){
      setColor(newColorScheme);
  }
});

function setColor(color){;
    setVariables(aColor[color]);
    localStorage.setItem("colorTheme", color.toLowerCase());
}

function getColorList(){
    let keys = Object.keys(aColor);
    return keys;
}

function updateColor(color){
    
    if(!user){return;}
    
    user.theme = color.toLowerCase();

   putData('/users/'+ user['id'],user).done(function (response) {
        
        setColor(color.toLowerCase());
    })
    .fail(function (error) {
        checkError(error);
    })
}
