
/* Globals */
let lives = 3;
let score = 0;
let answer_streak = 0;

let correct_particle = "";
let go_next = true;

/**
 * This function will evaluate the user's answer and determine if they were right or wrong.
 * It will then do what is needed update the page accordingly.
 */
export function evaluate_answer() {
  const particle_input = document.getElementById("particle_input").value;
  const feedback = document.getElementById("feedback");
  const next_button = document.getElementById("next_button");
  const reset_button = document.getElementById("reset_button");
  const user_answer_streak = document.getElementById("answer_streak");

  if (lives > 0 && go_next) {
    if (particle_input === correct_particle) {
      feedback.innerText = "Correct! ✓";
      feedback.style.color = "green";

      answer_streak++;

      if (answer_streak > 2) {
        score += 2;
        user_answer_streak.innerText = answer_streak + " in a row! Double points!";
        user_answer_streak.style.display = "block";
      } else {
        score++;
      }

      if (answer_streak % 3 === 0) {
        if (lives < 3) {
          lives++;
          document.getElementById("user_lives").innerText = lives;
          const extra_life = document.getElementById("extra_life");
          extra_life.style.display = "block";
          extra_life.innerText = "+1 Life!";
          setTimeout(() => {
            extra_life.style.display = "none";
          }, 2000);
        }
      }

      go_next = false;

      document.getElementById("user_score").innerText = score;

      next_button.style.display = "block";
      next_button.addEventListener("click", display_sentence_to_website);

      reset_button.style.display = "none";
    } else {
      feedback.innerText = "Incorrect! ✘";
      feedback.style.color = "red";
      user_answer_streak.innerText = "";

      answer_streak = 0;

      lives--;

      document.getElementById("user_lives").innerText = lives;
      if (lives === 0) {
        feedback.innerText = "Game Over!";

        reset_button.style.display = "block";
        reset_button.addEventListener("click", () => {
          lives = 3;
          score = 0;
          document.getElementById("user_lives").innerText = lives;
          document.getElementById("user_score").innerText = score;
          display_sentence_to_website();
        });

        next_button.style.display = "none";
      }
    }
  }
}

/* This code will handle input that is done via the digital Japanese keyboard. */
export function add_particle(particle) {
  document.getElementById("particle_input").value = "";
  document.getElementById("particle_input").value += particle;
}

/* This function romanizes Japanese vocabularly (i.e 'わたし' becomes 'watashi'). Used in the tooltip for vocab words. */
function romanize(text) {
  if (wanakana.isKana(text)) {
    return wanakana.toRomaji(text);
  } else {
    console.log("romanize() was not provided with kana text.");
    return text;
  }
}

/**
 * This function retrives the parsed Japanese sentence from sentence_generator.mjs. Returns it as a JSON object.
 */
async function get_sentence_from_server() {
  try {
    const response = await fetch("http://localhost:3000/parse");

    const sentence_object = await response.json();
    return sentence_object;
  } catch (error) {
    console.error('Failed to get a random sentence from the server: ', error);
    return "No sentence created.";
  }
}

/**
 * This function will add the sentence from get_sentence_from_server() to the website with appropriate HTML tags. 
 * There will also be logic that selects a random particle to be the correct answer. That particle will be replaced by an empty form input.
 */
async function display_sentence_to_website() {
  // Before doing anything, we need to reset game mechanics when this function is called upon the user getting a correct answer.
  document.getElementById("feedback").innerText = "";
  document.getElementById("next_button").style.display = "none";
  document.getElementById("reset_button").style.display = "none";
  go_next = true;

  // Now we can get the sentence from the local server.
  const sentence_object = await get_sentence_from_server();
  const sentence_data = sentence_object.tokens;
  const english_data = sentence_object.english_definitions;

  // valid_particles is a list of particles that are valid for this game. sentence_particles will store all particles found in the sentence.
  const valid_particles = ["は", "が", "の", "に", "と", "で", "へ", "も", "や"];
  const sentence_particles = [];

  // figure out what particles are in the sentence
　sentence_data.forEach((token) => {
    if (valid_particles.includes(token.surface_form)) {
      sentence_particles.push({particle: token.surface_form, index: token.word_position});
    }
  });

  // If there are no particles in the sentence, then we need to try again.
  if (sentence_particles.length === 0) {
    display_sentence_to_website();
    return;
  }

  // select a random particle to be the correct answer. The index will be necessary in cases where they may be multiple particles of the same type.
  const random_index = Math.floor(Math.random() * sentence_particles.length);
  correct_particle = sentence_particles[random_index].particle;
  const correct_index = sentence_particles[random_index].index;
  

  //  add the words one by one with their necessary HTML tags.
  let sentence_html = "";
  let i = 0;
  
  sentence_data.forEach((token) => {
    if (token.word_position === correct_index) {
      sentence_html += `<span id="particle_wrap"><input type="text" id="particle_input" readonly></span>`; 
    }
    else {
      let english_reading = "";
      if (english_data[i].japanese && english_data[i].japanese.length > 0) {
        english_reading = english_data[i].japanese[0].reading;
      }

      let english_definitions = "No definition found.";
      if (english_data[i].senses && english_data[i].senses.length > 0) {
        if (english_data[i].senses[0].english_definitions && english_data[i].senses[0].english_definitions.length > 0) {
          english_definitions = english_data[i].senses[0].english_definitions.join(", ");
        }
      }

      sentence_html += `
      <div class="word">
        <span class="popup_window">
          <p class="romaji">${romanize(token.pronunciation)}</p>
          <p>${english_reading}</p>
          <p>${english_definitions}</p>
        </span>
        <span class="actual_word">${token.surface_form}</span>
      </div>
      `;
    }
    i++;
  });

  // add the HTML to its div.
  const sentence_div = document.getElementsByClassName("japanese_sentence")[0];
  sentence_div.innerHTML = sentence_html;
}

/* This code will call all necessary functions on load and also gives the words their tooltip. */
document.addEventListener("DOMContentLoaded", async function() {
  await display_sentence_to_website();

  /* Gives the words their helpful tooltips. */
  const japanese_words = document.querySelectorAll(".word");

  japanese_words.forEach(word => {
    word.addEventListener("mouseover", function() {
      const popup_window = word.querySelector(".popup_window");
      const word_rect = word.getBoundingClientRect();
      let top_position = word_rect.top - 200;
      top_position *= -1;
      console.log(top_position);
      popup_window.style.top = top_position + "px";
    });
  });

  /* Gives the digital keyboard its functionality. */
  const particle_keyboard_buttoms = document.querySelectorAll(".particle_keyboard_button");
  particle_keyboard_buttoms.forEach(button => {
    button.addEventListener("click", function(event) {
      const current_particle = event.currentTarget.getAttribute("data-particle");
      add_particle(current_particle);
    });
  });

  /* Gives the evaluate button its functionality. */
  const evaluate_button = document.getElementById("evaluate_button");
  evaluate_button.addEventListener("click", evaluate_answer);

});
