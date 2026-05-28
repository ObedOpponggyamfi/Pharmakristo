import os
import re
import pandas as pd
import matplotlib.pyplot as plt

from collections import Counter

import nltk
from nltk.corpus import stopwords

from wordcloud import WordCloud

nltk.download('stopwords')

folder = "transcripts"

data = []

for file in os.listdir(folder):

    if file.endswith(".txt"):

        with open(os.path.join(folder, file),
                  "r",
                  encoding="utf-8") as f:

            text = f.read()

        data.append({
            "file": file,
            "text": text
        })

df = pd.DataFrame(data)

print(df.head())

def classify(file):

    if "chief" in file:
        return "Traditional Leaders"

    else:
        return "Government Officials"

df["group"] = df["file"].apply(classify)

print(df[["file", "group"]])


stop_words = set(stopwords.words('english'))

def clean_text(text):

    text = text.lower()

    text = re.sub(r'[^a-zA-Z\s]', '', text)

    words = text.split()

    words = [
        w for w in words
        if w not in stop_words
    ]

    return " ".join(words)

df["clean_text"] = df["text"].apply(clean_text)

print(df["clean_text"][0][:500])


all_words = " ".join(df["clean_text"]).split()

word_counts = Counter(all_words)

top_words = word_counts.most_common(20)

print(top_words)

all_words = " ".join(df["clean_text"]).split()

word_counts = Counter(all_words)

top_words = word_counts.most_common(20)

print(top_words)

text = " ".join(df["clean_text"])

wordcloud = WordCloud(
    width=1200,
    height=600,
    background_color='white'
).generate(text)

plt.figure(figsize=(15,7))

plt.imshow(wordcloud)

plt.axis("off")

plt.title("Interview Word Cloud")

plt.show()

themes = {

    "Development": [
        "roads",
        "schools",
        "water",
        "healthcare",
        "electricity"
    ],

    "Youth_Issues": [
        "youth",
        "unemployment",
        "jobs",
        "training"
    ],

    "Governance": [
        "government",
        "assembly",
        "district",
        "policies"
    ],

    "Traditional_Leadership": [
        "chiefs",
        "elders",
        "peace",
        "community"
    ]
}


for theme, keywords in themes.items():

    df[theme] = df["clean_text"].apply(

        lambda x: sum(
            word in x
            for word in keywords
        )
    )

print(df.head())


group_analysis = df.groupby("group")[

    [
        "Development",
        "Youth_Issues",
        "Governance",
        "Traditional_Leadership"
    ]

].sum()

print(group_analysis)

group_analysis.plot(
    kind='bar',
    figsize=(10,6)
)

plt.title("Theme Comparison by Group")

plt.ylabel("Frequency")

plt.xticks(rotation=0)

plt.show()

df.to_excel(
    "interview_analysis.xlsx",
    index=False
)