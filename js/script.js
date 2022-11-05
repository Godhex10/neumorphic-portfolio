let menu = document.querySelector('#menu-btn');
let header = document.querySelector('.header');
let themeToggler = document.querySelector('#theme-toggler');

const toggle_btn = document.querySelector("#theme-toggler");

menu.onclick = () =>{
    menu.classList.toggle('fa-times');
    header.classList.toggle('active');
}

//themeToggler.onclick = () =>{
    //themeToggler.classList.toggle('fa-moon');
   // if(themeToggler.classList.contains(fa-sun)){
       // document.body.classList.add(active);
   // }else{
        document.body.classList.remove('active'); 
   // }
//}




function changeTheme() {
    if (!document.body.classList.contains("active")) {
        document.body.classList.add("active");
        toggle_btn.classList.replace("fa-moon", "fa-sun");
    } else{
        document.body.classList.remove("active");
        toggle_btn.classList.replace("fa-sun", "fa-moon"); 
           
    }
}

toggle_btn.addEventListener("click", () => {
    changeTheme();
});