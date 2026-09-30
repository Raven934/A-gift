import { useEffect, useMemo, useState } from "react";
import "./App.css";

const storedPin = () => window.sessionStorage.getItem("sanctuaryPin") || "";

const api = async (path, options = {}) => {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      body.message ||
        Object.values(body.errors || {})
          .flat()
          .join(" ") ||
        "The sanctuary server could not complete that request.",
    );
  return body;
};

function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState(storedPin);
  const [authorPin, setAuthorPin] = useState(storedPin);
  const [pinError, setPinError] = useState(false);
  const [loading, setLoading] = useState(Boolean(storedPin()));
  const [checkingAccess, setCheckingAccess] = useState(Boolean(storedPin()));
  const [error, setError] = useState("");
  const [isAuthor, setIsAuthor] = useState(false);
  const [pingCount, setPingCount] = useState(0);
  const [posts, setPosts] = useState([]);
  const [envelopes, setEnvelopes] = useState([]);
  const [activeTag, setActiveTag] = useState("all");
  const [tab, setTab] = useState("feed");
  const [modal, setModal] = useState(null);
  const [composerType, setComposerType] = useState("post");
  const [floatingHeart, setFloatingHeart] = useState(false);

  useEffect(() => {
    const savedPin = storedPin();
    if (!savedPin) return;

    api("/sanctuary", {
      headers: { "X-Sanctuary-Pin": savedPin },
    })
      .then((data) => {
        setPosts(data.posts);
        setEnvelopes(data.envelopes);
        setPingCount(data.pingCount || 0);
        setUnlocked(true);
      })
      .catch(() => {
        window.sessionStorage.removeItem("sanctuaryPin");
        setPin("");
        setAuthorPin("");
      })
      .finally(() => {
        setLoading(false);
        setCheckingAccess(false);
      });
  }, []);

  const filteredPosts = useMemo(
    () =>
      activeTag === "all"
        ? posts
        : posts.filter((post) => post.tag === activeTag),
    [activeTag, posts],
  );

  const unlock = async (event) => {
    event.preventDefault();
    setLoading(true);
    setPinError(false);
    try {
      await api("/unlock", { method: "POST", body: JSON.stringify({ pin }) });
      const data = await api("/sanctuary", {
        headers: { "X-Sanctuary-Pin": pin },
      });
      setAuthorPin(pin);
      setPosts(data.posts);
      setEnvelopes(data.envelopes);
      setPingCount(data.pingCount || 0);
      window.sessionStorage.setItem("sanctuaryPin", pin);
      setUnlocked(true);
    } catch {
      setPinError(true);
    } finally {
      setLoading(false);
    }
  };

  const sendPing = async () => {
    try {
      const data = await api("/sanctuary/ping", {
        method: "POST",
        headers: { "X-Sanctuary-Pin": authorPin },
      });
      setPingCount(data.pingCount);
      setFloatingHeart(true);
      window.setTimeout(() => setFloatingHeart(false), 1200);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const addPost = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const data = await api("/sanctuary/posts", {
        method: "POST",
        headers: {
          "X-Sanctuary-Pin": authorPin,
          "X-Author-Pin": authorPin,
        },
        body: JSON.stringify({
          title: form.get("title"),
          tag: form.get("tag"),
          date: form.get("date"),
          content: form.get("content"),
          imageUrl: form.get("media") || null,
        }),
      });
      setPosts((current) => [
        {
          ...data.post,
          id: String(data.post.id),
          imageUrl: data.post.image_url,
        },
        ...current,
      ]);
      formElement.reset();
      setModal(null);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const addEnvelope = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const data = await api("/sanctuary/envelopes", {
        method: "POST",
        headers: {
          "X-Sanctuary-Pin": authorPin,
          "X-Author-Pin": authorPin,
        },
        body: JSON.stringify({
          title: form.get("title"),
          category: form.get("category"),
          content: form.get("content"),
        }),
      });
      setEnvelopes((current) => [
        { ...data.envelope, id: String(data.envelope.id) },
        ...current,
      ]);
      formElement.reset();
      setModal(null);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  if (checkingAccess)
    return (
      <div className="gate">
        <div className="gate-card">
          <div className="round-icon">♥</div>
          <h2>Opening Sanctuary…</h2>
        </div>
      </div>
    );

  if (!unlocked)
    return (
      <div className="gate">
        <div className="gate-card">
          <div className="round-icon">♥</div>
          <h2>Our Little Cozy Corner</h2>
          <p>Enter our special code to enter our private diary space.</p>
          <form onSubmit={unlock}>
            <input
              autoFocus
              type="password"
              maxLength="10"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              placeholder="Enter our special code"
            />
            {pinError && (
              <small className="error">
                Remember... When it all started...
              </small>
            )}
            <button className="primary wide" type="submit" disabled={loading}>
              {loading ? "Opening…" : "Unlock Sanctuary ♥"}
            </button>
          </form>
        </div>
      </div>
    );

  return (
    <div className="app-shell">
      {error && (
        <div className="api-error" role="alert">
          {error}
          <button onClick={() => setError("")}>×</button>
        </div>
      )}
      {floatingHeart && <span className="floating-heart">♥</span>}
      <header className="site-header">
        <div className="content header-inner">
          <div className="brand">
            <div className="brand-mark">A</div>
            <div>
              <h1>For My Love</h1>
              <p>Private Journal &amp; Notes</p>
            </div>
          </div>
          <div className="header-actions">
            <button
              className={`mode-button ${isAuthor ? "selected" : ""}`}
              onClick={() => setIsAuthor((value) => !value)}
            >
              ✎ <span>{isAuthor ? "Author Mode ♥" : "Reader Mode"}</span>
            </button>
            <button className="primary ping-button" onClick={sendPing}>
              ♥ <span>Thinking of You</span> <b>{pingCount}</b>
            </button>
          </div>
        </div>
      </header>
      <section className="content hero-card">
        <div>
          <span className="live-pill">✈ Updated Live</span>
          <h2>A cozy place for my thoughts, poems, and notes for you.</h2>
          <p className="quote">
            “No matter where the day takes us, this little corner will always
            lead me back to you... and hope it leads you back to me.”
          </p>
        </div>
        {isAuthor && (
          <button className="primary" onClick={() => setModal("compose")}>
            ＋ New Entry
          </button>
        )}
      </section>
      <nav className="content tabs">
        <button
          className={tab === "feed" ? "active" : ""}
          onClick={() => setTab("feed")}
        >
          ☷ Timeline Feed
        </button>
        <button
          className={tab === "envelopes" ? "active" : ""}
          onClick={() => setTab("envelopes")}
        >
          ✉ Envelope Vault <span>(“Open When...”)</span>
        </button>
      </nav>
      <main className="content main-content">
        {tab === "feed" ? (
          <section className="feed">
            <div className="filters">
              <span>⚲ Filter:</span>
              {["all", "quick-thought", "poem", "memory", "audio"].map(
                (tag) => (
                  <button
                    key={tag}
                    className={activeTag === tag ? "active" : ""}
                    onClick={() => setActiveTag(tag)}
                  >
                    {tag === "all" ? "All Entries" : `#${tag}`}
                  </button>
                ),
              )}
            </div>
            <div className="post-list">
              {filteredPosts.length ? (
                filteredPosts.map((post) => (
                  <article className="post-card" key={post.id}>
                    <div className="post-meta">
                      <span>#{post.tag}</span>
                      <time>{post.date}</time>
                    </div>
                    <h3>{post.title}</h3>
                    {post.imageUrl && (
                      <img
                        className="post-image"
                        src={post.imageUrl}
                        alt="Note attachment"
                      />
                    )}
                    <p className="post-content">{post.content}</p>
                    <div className="post-footer">
                      <button
                        onClick={async () => {
                          try {
                            const data = await api(
                              `/sanctuary/posts/${post.id}/like`,
                              {
                                method: "POST",
                                headers: {
                                  "X-Sanctuary-Pin": authorPin,
                                },
                              },
                            );
                            setPosts((current) =>
                              current.map((item) =>
                                item.id === post.id
                                  ? { ...item, likes: data.likes }
                                  : item,
                              ),
                            );
                          } catch (requestError) {
                            setError(requestError.message);
                          }
                        }}
                      >
                        ♡ Read with love <b>{post.likes}</b>
                      </button>
                      <small>Forever saved</small>
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty">
                  ♡<p>No notes found under #{activeTag} yet.</p>
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="envelopes">
            <div className="section-intro">
              <h3>Digital Envelope Vault</h3>
              <p>
                Click any envelope below when you are feeling the matching mood
                or moment.
              </p>
            </div>
            <div className="envelope-grid">
              {envelopes.map((envelope) => (
                <button
                  className="envelope-card"
                  key={envelope.id}
                  onClick={() => setModal({ type: "read", envelope })}
                >
                  <div className="envelope-top">
                    <span>{envelope.category}</span>
                    <i>♥</i>
                  </div>
                  <h4>{envelope.title}</h4>
                  <strong>Open Letter →</strong>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
      <footer>
        <span>Made with infinite warmth and care.</span>
        <span>
          Our Private Corner{" "}
          <button className="star" onClick={() => setModal("secret")}>
            ♥
          </button>
        </span>
      </footer>
      {modal === "compose" && (
        <Composer
          type={composerType}
          setType={setComposerType}
          onClose={() => setModal(null)}
          onPost={addPost}
          onEnvelope={addEnvelope}
        />
      )}
      {modal?.type === "read" && (
        <Modal onClose={() => setModal(null)}>
          <div className="read-envelope">
            <div className="round-icon">✉</div>
            <h3>{modal.envelope.title}</h3>
            <span className="category">{modal.envelope.category}</span>
            <p>{modal.envelope.content}</p>
            <em>Always here for you ♥</em>
          </div>
        </Modal>
      )}
      {modal === "secret" && (
        <Modal onClose={() => setModal(null)}>
          <div className="secret">
            <div className="round-icon">♥</div>
            <h3>A Secret Note</h3>
            <small>You found the hidden star!</small>
            <p>
              “If you ever find yourself doubting the depth of my heart, step
              back into this quiet sanctuary. I built this little haven just for
              you a place where my love can gently whisper to yours, wrapping
              you in warmth and keeping my devotion close to you, wherever your
              journey leads.”
            </p>
            <button className="primary" onClick={() => setModal(null)}>
              Close Secret
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="modal">
        <button className="close" onClick={onClose}>
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

function Composer({ type, setType, onClose, onPost, onEnvelope }) {
  return (
    <Modal onClose={onClose}>
      <h3>Create New Entry</h3>
      <div className="composer-tabs">
        <button
          className={type === "post" ? "active" : ""}
          onClick={() => setType("post")}
        >
          Timeline Note
        </button>
        <button
          className={type === "envelope" ? "active" : ""}
          onClick={() => setType("envelope")}
        >
          “Open When...” Envelope
        </button>
      </div>
      {type === "post" ? (
        <form className="entry-form" onSubmit={onPost}>
          <label>
            Title
            <input name="title" required placeholder="A title for today..." />
          </label>
          <div className="form-row">
            <label>
              Tag Category
              <select name="tag">
                <option value="quick-thought">#quick-thought</option>
                <option value="poem">#poem</option>
                <option value="memory">#memory</option>
                <option value="audio">#audio</option>
              </select>
            </label>
            <label>
              Date
              <input name="date" placeholder="Today's date" />
            </label>
          </div>
          <label>
            Your Writing / Poem / Note
            <textarea
              name="content"
              rows="5"
              required
              placeholder="Write your heartfelt note here..."
            />
          </label>
          <label>
            Optional Image URL or Audio Link
            <input name="media" type="url" placeholder="https://..." />
          </label>
          <button className="primary wide" type="submit">
            ✈ Publish Note
          </button>
        </form>
      ) : (
        <form className="entry-form" onSubmit={onEnvelope}>
          <label>
            Envelope Prompt Title
            <input
              name="title"
              required
              placeholder="e.g., Open when you miss me"
            />
          </label>
          <label>
            Category / Icon Mood
            <select name="category">
              <option value="Comfort">Comfort</option>
              <option value="Love">Love</option>
              <option value="Fun">Fun</option>
              <option value="Night">Night</option>
            </select>
          </label>
          <label>
            Secret Letter Content
            <textarea
              name="content"
              rows="6"
              required
              placeholder="Write the secret letter inside..."
            />
          </label>
          <button className="primary wide" type="submit">
            ▣ Seal Envelope
          </button>
        </form>
      )}
    </Modal>
  );
}

export default App;
