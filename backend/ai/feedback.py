import sys
import json

def basic_py_sentiment(text: str) -> str:
    t = (text or '').lower()
    pos = ['good','great','excellent','love','nice','happy','awesome','fantastic']
    neg = ['bad','poor','terrible','hate','awful','sad','disappoint']
    score = 0
    for w in pos:
        if w in t:
            score += 1
    for w in neg:
        if w in t:
            score -= 1
    if score > 0:
        return 'positive'
    if score < 0:
        return 'negative'
    return 'neutral'

def analyze(message: str) -> str:
    # Try to use TextBlob if available for better analysis
    try:
        from textblob import TextBlob
        polarity = TextBlob(message).sentiment.polarity
        if polarity > 0.1:
            return 'positive'
        if polarity < -0.1:
            return 'negative'
        return 'neutral'
    except Exception:
        # Fallback to simple python heuristic
        return basic_py_sentiment(message)

def main():
    try:
        raw = sys.stdin.read()
        if not raw:
            # also accept first arg as fallback
            if len(sys.argv) > 1:
                message = sys.argv[1]
            else:
                message = ''
        else:
            try:
                data = json.loads(raw)
                message = data.get('message', '')
            except Exception:
                # raw text
                message = raw.strip()

        sentiment = analyze(message)
        print(json.dumps({ 'sentiment': sentiment }))
    except Exception as e:
        # Never crash — print neutral as fallback
        try:
            print(json.dumps({ 'sentiment': basic_py_sentiment('') }))
        except Exception:
            print(json.dumps({ 'sentiment': 'neutral' }))

if __name__ == '__main__':
    main()
