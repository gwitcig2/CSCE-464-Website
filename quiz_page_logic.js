/* This code will handle input that is done via the digital Japanese keyboard. */

function add_particle(particle) {
  document.getElementById("particle_input").value = "";
  document.getElementById("particle_input").value += particle;
}

/* This code will handle the positoning of the tooltip above a Japanese word. */

document.addEventListener("DOMContentLoaded", function() {
  const japanese_words = document.querySelectorAll(".word");

  japanese_words.forEach(word => {
    word.addEventListener("mouseover", function() {
      const popup_window = word.querySelector(".popup_window");
      const word_rect = word.getBoundingClientRect();
      let top_position = word_rect.top - 269;
      top_position *= -1;
      console.log(top_position);
      popup_window.style.top = top_position + "px";
    });
  });
});

/*This code will be responsible for handling the user's answer.*/

let lives = 3;
let score = 0;

let go_next = true;

/**
 * This function will simply evaluate the user's answer and determine if they were right or wrong.
 * It will then do what is needed update the page accordingly.
 */
function evaluate_answer() {
  const particle_input = document.getElementById("particle_input").value;

  const correct_particle = "は";

  const feedback = document.getElementById("feedback");

  if (lives > 0 && go_next) {
    if (particle_input === correct_particle) {
      feedback.innerText = "Correct! ✓";
      feedback.style.color = "green";
      score++;
      document.getElementById("user_score").innerText = score;
      go_next = false;
    } else {
      feedback.innerText = "Incorrect! ✘";
      feedback.style.color = "red";
      lives--;
      document.getElementById("user_lives").innerText = lives;
      if (lives === 0) {
        feedback.innerText = "Game Over!";
      }
    }
  }
}