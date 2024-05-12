/* Importing all necessary server libraries & the parser for Kuromoji */
import kuromoji from 'kuromoji';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

/* Using express on port 3000 */
const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());
app.use('/data_files', express.static('data_files'));
app.use(express.static("public"));

/* Building the tokenizer */
let tokenizer;

kuromoji.builder({ dicPath: "node_modules/kuromoji/dict" }).build((err, _tokenizer) => {
    if (err) throw err;
    tokenizer = _tokenizer;
    console.log("Tokenizer is ready");
});

/* Putting the Japanese sentences from jpn_sentences.tsv into an array */
let japanese_sentences = [];

async function load_sentences_from_tsv() {
    try {
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const file_path = path.join(__dirname, 'data_files', 'jpn_sentences.tsv');
        const text = fs.readFileSync(file_path, {encoding: 'utf-8'});

        japanese_sentences = text.split('\n').map(line => {
            const parts = line.trim().split('\t');
            return parts[2];
        });
    } catch (error) {
        console.error('Failed to load the TSV file jpn_sentences: ', error);
    }
}

/* This grabs my OpenAI API key from config.json. Currently not in use since I don't wish to pay for the API. */
async function loadConfig() {
    try {
        const data = await fs.readFile('config.json', {encoding: 'utf-8'});
        return JSON.parse(data);
    } catch (error) {
        console.error('config.json failed to load: ', error);
        return {};
    }
}

/* This function uses OpenAI's API to generate a random Japanese sentence. Currently not in use since I don't wish to pay for the API. */
async function generate_ai_sentence() {
    // Grabbing the API key from config.json
    const config = await loadConfig();
    if (!config.apiKey) {
        console.error('API key is missing from config.json');
        return 'didnt work sry lol';
    }

    try {
        const response = await fetch('https://api.openai.com/v1/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model: "text-davinci-002",
                prompt: "Create a single sentence in Japanese that a person with N5-N4 proficency in Japanese can comprehend. Please use at least three particles in the sentence (such as は、の、に、と、etcetera.)",
                max_tokens: 60
            })
        });

        if (!response.ok) {
            throw new Error(`API failed to generate a sentence: ${response.status} ${response.statusText}`);
        }

        const ai_response = await response.json();
        return ai_response.choices[0].text.trim();
    } catch (error) {
        console.error('Failed to generate an AI sentence: ', error);
        return 'didnt work sry lol';
    }
}

/* This function uses Jisho's unofficial API to get the English definition of the Japanese words parsed by the Kuromoji tokenizer. */
async function get_english_definition(word) {
    try {
      const response = await fetch(`https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(word)}`, {
        headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
        }
      });

      const english_definition = await response.json();

      if (english_definition && english_definition.data.length > 0) {
        return english_definition.data[0];
      }

      return "No definition found.";
    } catch (error) {
      console.error('Failed to get the English definition: ', error);
      return 'エラーです...';
    }
  
  }

/* This is the official call to the server. As a JSON object, it will return a random Japanese sentence, the tokens parsed by Kuromoji, and the English definitions of those tokens. */
app.get("/parse", async (req, res) => {
    if (!tokenizer) {
        return res.status(503).send("Tokenizer is not ready");
    }

    // Only call load_sentences_from_tsv() if the array is empty. Helps with performance.
    if (japanese_sentences.length === 0) {
        await load_sentences_from_tsv();
    }

    const random_sentence = japanese_sentences[Math.floor(Math.random() * japanese_sentences.length)];
    const tokens = tokenizer.tokenize(random_sentence);
    const english_definitions = await Promise.all(tokens.map(token => get_english_definition(token.surface_form)));

    console.log("REQUEST COMPLETE");

    // const ai_sentence = await generate_ai_sentence();
    // console.log("generate_ai_sentence(): " + ai_sentence);
    // const ai_tokens = tokenizer.tokenize(ai_sentence);

    res.json({
        random_sentence: random_sentence,
        tokens: tokens,
        english_definitions: english_definitions
    });

});

// Informational message to the server to verify it's running
app.listen(port, () => {
    console.log(`Server is running on localhost:${port}`);
});