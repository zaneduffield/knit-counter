import document from "document";

let bigNum = document.getElementById("big-num");
if (bigNum != null) {
    bigNum.text = "1"
} else {
    console.error("couldn't find element 'big-num'")
}
console.log('Hello world 2!');
