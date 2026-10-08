import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://for-him-okg8.onrender.com/api";
const storedPin = () => window.sessionStorage.getItem("sanctuaryPin") || "";

const spotifyEmbed = (url) => {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(
      /\/(track|playlist)\/([A-Za-z0-9]+)$/,
    );
    return match
      ? {
          type: match[1],
          url: `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator`,
        }
      : null;
  } catch {
    return null;
  }
};

const api = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
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
  const favoritePosts = useMemo(
    () => posts.filter((post) => post.isFavorite),
    [posts],
  );
  const favoriteEnvelopes = useMemo(
    () => envelopes.filter((envelope) => envelope.isFavorite),
    [envelopes],
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
    const editingPost = modal?.type === "edit" ? modal.post : null;
    try {
      const data = await api(
        editingPost
          ? `/sanctuary/posts/${editingPost.id}`
          : "/sanctuary/posts",
        {
        method: editingPost ? "PUT" : "POST",
        headers: {
          "X-Sanctuary-Pin": authorPin,
          "X-Author-Pin": authorPin,
        },
        body: JSON.stringify({
          title: form.get("title"),
          tag: form.get("tag"),
          date: form.get("date"),
          content: form.get("content"),
          imageUrl: form.get("imageUrl") || null,
          spotifyPlaylistUrl: form.get("spotifyPlaylistUrl") || null,
        }),
        },
      );
      const savedPost = {
          ...data.post,
          id: String(data.post.id),
          imageUrl: data.post.image_url,
          spotifyPlaylistUrl: data.post.spotify_playlist_url,
          isFavorite: Boolean(data.post.is_favorite),
      };
      setPosts((current) =>
        editingPost
          ? current.map((post) =>
              post.id === editingPost.id ? savedPost : post,
            )
          : [savedPost, ...current],
      );
      formElement.reset();
      setModal(null);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const deletePost = async (post) => {
    if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return;

    try {
      await api(`/sanctuary/posts/${post.id}`, {
        method: "DELETE",
        headers: {
          "X-Sanctuary-Pin": authorPin,
          "X-Author-Pin": authorPin,
        },
      });
      setPosts((current) => current.filter((item) => item.id !== post.id));
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const addEnvelope = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const editingEnvelope =
      modal?.type === "editEnvelope" ? modal.envelope : null;
    try {
      const data = await api(
        editingEnvelope
          ? `/sanctuary/envelopes/${editingEnvelope.id}`
          : "/sanctuary/envelopes",
        {
        method: editingEnvelope ? "PUT" : "POST",
        headers: {
          "X-Sanctuary-Pin": authorPin,
          "X-Author-Pin": authorPin,
        },
        body: JSON.stringify({
          title: form.get("title"),
          category: form.get("category"),
          content: form.get("content"),
        }),
        },
      );
      const savedEnvelope = {
        ...data.envelope,
        id: String(data.envelope.id),
        isFavorite: Boolean(data.envelope.is_favorite),
      };
      setEnvelopes((current) =>
        editingEnvelope
          ? current.map((envelope) =>
              envelope.id === editingEnvelope.id ? savedEnvelope : envelope,
            )
          : [savedEnvelope, ...current],
      );
      formElement.reset();
      setModal(null);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const deleteEnvelope = async (envelope) => {
    if (
      !window.confirm(
        `Delete “${envelope.title}”? This cannot be undone.`,
      )
    )
      return;

    try {
      await api(`/sanctuary/envelopes/${envelope.id}`, {
        method: "DELETE",
        headers: {
          "X-Sanctuary-Pin": authorPin,
          "X-Author-Pin": authorPin,
        },
      });
      setEnvelopes((current) =>
        current.filter((item) => item.id !== envelope.id),
      );
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const closeComposer = () => {
    setModal(null);
    setComposerType("post");
  };

  const togglePostFavorite = async (post) => {
    try {
      const data = await api(`/sanctuary/posts/${post.id}/favorite`, {
        method: "POST",
        headers: { "X-Sanctuary-Pin": authorPin },
      });
      setPosts((current) =>
        current.map((item) =>
          item.id === post.id
            ? { ...item, isFavorite: data.isFavorite }
            : item,
        ),
      );
      if (modal?.type === "readPost" && modal.post.id === post.id) {
        setModal({ type: "readPost", post: { ...post, isFavorite: data.isFavorite } });
      }
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const toggleEnvelopeFavorite = async (envelope) => {
    try {
      const data = await api(`/sanctuary/envelopes/${envelope.id}/favorite`, {
        method: "POST",
        headers: { "X-Sanctuary-Pin": authorPin },
      });
      setEnvelopes((current) =>
        current.map((item) =>
          item.id === envelope.id
            ? { ...item, isFavorite: data.isFavorite }
            : item,
        ),
      );
      if (modal?.type === "read" && modal.envelope.id === envelope.id) {
        setModal({
          type: "read",
          envelope: { ...envelope, isFavorite: data.isFavorite },
        });
      }
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
        <button
          className={tab === "favorites" ? "active" : ""}
          onClick={() => setTab("favorites")}
        >
          ♥ Favorites <span>({favoritePosts.length + favoriteEnvelopes.length})</span>
        </button>
      </nav>
      <main className="content main-content">
        {tab === "feed" ? (
          <section className="feed">
            <div className="filters">
              <span>⚲ Filter:</span>
              {["all", "quick-thought", "poem", "memory", "playlist"].map(
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
                    {post.spotifyPlaylistUrl &&
                      spotifyEmbed(post.spotifyPlaylistUrl) && (
                        <div className="spotify-card">
                          <div className="spotify-card-label">
                            <span>♫</span>
                            {spotifyEmbed(post.spotifyPlaylistUrl).type ===
                            "track"
                              ? "Song"
                              : "Playlist"}
                          </div>
                          <iframe
                            className="spotify-player"
                            src={spotifyEmbed(post.spotifyPlaylistUrl).url}
                            title={`${post.title} Spotify ${
                              spotifyEmbed(post.spotifyPlaylistUrl).type
                            }`}
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                            loading="lazy"
                          />
                          <a
                            className="spotify-link"
                            href={post.spotifyPlaylistUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open in Spotify ↗
                          </a>
                        </div>
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
                      <button
                        className={`favorite-button ${post.isFavorite ? "active" : ""}`}
                        onClick={() => togglePostFavorite(post)}
                        aria-label={`${post.isFavorite ? "Remove" : "Add"} ${post.title} ${post.isFavorite ? "from" : "to"} favorites`}
                      >
                        {post.isFavorite ? "♥ Favorite" : "♡ Favorite"}
                      </button>
                      <div className="post-actions">
                        {isAuthor && (
                          <>
                            <button
                              className="post-action"
                              onClick={() => setModal({ type: "edit", post })}
                            >
                              Edit
                            </button>
                            <button
                              className="post-action delete"
                              onClick={() => deletePost(post)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                        <small>Forever saved</small>
                      </div>
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
        ) : tab === "envelopes" ? (
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
                <div className="envelope-card-shell" key={envelope.id}>
                  <button
                    className="envelope-card"
                    onClick={() => setModal({ type: "read", envelope })}
                  >
                    <div className="envelope-top">
                      <span>{envelope.category}</span>
                      <i>♥</i>
                    </div>
                    <h4>{envelope.title}</h4>
                    <strong>Open Letter →</strong>
                  </button>
                  <button
                    className={`favorite-button envelope-favorite ${envelope.isFavorite ? "active" : ""}`}
                    onClick={() => toggleEnvelopeFavorite(envelope)}
                    aria-label={`${envelope.isFavorite ? "Remove" : "Add"} ${envelope.title} ${envelope.isFavorite ? "from" : "to"} favorites`}
                  >
                    {envelope.isFavorite ? "♥ Favorite" : "♡ Favorite"}
                  </button>
                  {isAuthor && (
                    <div className="envelope-actions">
                      <button
                        className="post-action"
                        onClick={() =>
                          setModal({ type: "editEnvelope", envelope })
                        }
                      >
                        Edit
                      </button>
                      <button
                        className="post-action delete"
                        onClick={() => deleteEnvelope(envelope)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="favorites">
            <div className="section-intro">
              <h3>Your Favorite Little Things</h3>
              <p>All the notes and letters you want to come back to.</p>
            </div>
            {favoritePosts.length || favoriteEnvelopes.length ? (
              <div className="favorite-list">
                {favoritePosts.map((post) => (
                  <article className="post-card" key={`favorite-post-${post.id}`}>
                    <div className="post-meta">
                      <span>#{post.tag}</span>
                      <time>{post.date}</time>
                    </div>
                    <h3>{post.title}</h3>
                    <p className="post-content">{post.content}</p>
                    <div className="post-footer">
                      <button
                        className="favorite-button active"
                        onClick={() => togglePostFavorite(post)}
                        aria-label={`Remove ${post.title} from favorites`}
                      >
                        ♥ Favorite
                      </button>
                      <button
                        className="read-link"
                        onClick={() => setModal({ type: "readPost", post })}
                      >
                        Read note →
                      </button>
                    </div>
                  </article>
                ))}
                {favoriteEnvelopes.map((envelope) => (
                  <article className="favorite-envelope" key={`favorite-envelope-${envelope.id}`}>
                    <div className="envelope-top">
                      <span>{envelope.category}</span>
                      <i>♥</i>
                    </div>
                    <h4>{envelope.title}</h4>
                    <p>{envelope.content}</p>
                    <div className="favorite-envelope-footer">
                      <button
                        className="favorite-button active"
                        onClick={() => toggleEnvelopeFavorite(envelope)}
                        aria-label={`Remove ${envelope.title} from favorites`}
                      >
                        ♥ Favorite
                      </button>
                      <button
                        className="read-link"
                        onClick={() => setModal({ type: "read", envelope })}
                      >
                        Open letter →
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty">
                ♡<p>Your favorites will appear here when something speaks to your heart.</p>
              </div>
            )}
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
          onClose={closeComposer}
          onPost={addPost}
          onEnvelope={addEnvelope}
        />
      )}
      {modal?.type === "editEnvelope" && (
        <Composer
          type="envelope"
          setType={() => {}}
          initialEnvelope={modal.envelope}
          onClose={() => setModal(null)}
          onPost={addPost}
          onEnvelope={addEnvelope}
          editing
        />
      )}
      {modal?.type === "edit" && (
        <Composer
          type="post"
          setType={() => {}}
          initialPost={modal.post}
          onClose={() => setModal(null)}
          onPost={addPost}
          onEnvelope={addEnvelope}
          editing
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
      {modal?.type === "readPost" && (
        <Modal onClose={() => setModal(null)}>
          <div className="read-envelope">
            <div className="round-icon">♥</div>
            <h3>{modal.post.title}</h3>
            <span className="category">#{modal.post.tag}</span>
            <p>{modal.post.content}</p>
            <button
              className={`favorite-button ${modal.post.isFavorite ? "active" : ""}`}
              onClick={() => togglePostFavorite(modal.post)}
            >
              {modal.post.isFavorite
                ? "♥ Saved to Favorites"
                : "♡ Add to Favorites"}
            </button>
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

function Composer({
  type,
  setType,
  initialPost,
  initialEnvelope,
  onClose,
  onPost,
  onEnvelope,
  editing = false,
}) {
  const [formTag, setFormTag] = useState(initialPost?.tag || "quick-thought");

  return (
    <Modal onClose={onClose}>
      <h3>{editing ? "Edit Entry" : "Create New Entry"}</h3>
      {!editing && (
        <div className="composer-tabs">
          <button
            type="button"
            className={type === "post" ? "active" : ""}
            onClick={() => setType("post")}
          >
            Timeline Note
          </button>
          <button
            type="button"
            className={type === "envelope" ? "active" : ""}
            onClick={() => setType("envelope")}
          >
            “Open When...” Envelope
          </button>
        </div>
      )}
      {type === "post" ? (
        <form className="entry-form" onSubmit={onPost}>
          <label>
            Title
            <input
              name="title"
              required
              defaultValue={initialPost?.title || ""}
              placeholder="A title for today..."
            />
          </label>
          <div className="form-row">
            <label>
              Tag Category
              <select
                name="tag"
                value={formTag}
                onChange={(event) => setFormTag(event.target.value)}
              >
                <option value="quick-thought">#quick-thought</option>
                <option value="poem">#poem</option>
                <option value="memory">#memory</option>
                <option value="playlist">#playlist</option>
              </select>
            </label>
            <label>
              Date
              <input
                name="date"
                defaultValue={initialPost?.date || ""}
                placeholder="Today's date"
              />
            </label>
          </div>
          <label>
            Your Writing / Poem / Note
            <textarea
              name="content"
              rows="5"
              defaultValue={initialPost?.content || ""}
              placeholder="Write your heartfelt note here..."
            />
          </label>
          {formTag === "playlist" ? (
            <label>
              Spotify Playlist URL
              <input
                name="spotifyPlaylistUrl"
                type="url"
                required
                defaultValue={initialPost?.spotifyPlaylistUrl || ""}
                placeholder="https://open.spotify.com/playlist/..."
              />
            </label>
          ) : (
            <label>
              Optional Image URL
              <input
                name="imageUrl"
                type="url"
                defaultValue={initialPost?.imageUrl || ""}
                placeholder="https://..."
              />
            </label>
          )}
          <button className="primary wide" type="submit">
            {editing ? "Save Changes" : "✈ Publish Note"}
          </button>
        </form>
      ) : (
        <form className="entry-form" onSubmit={onEnvelope}>
          <label>
            Envelope Prompt Title
            <input
              name="title"
              required
              defaultValue={initialEnvelope?.title || ""}
              placeholder="e.g., Open when you miss me"
            />
          </label>
          <label>
            Category / Icon Mood
            <select name="category" defaultValue={initialEnvelope?.category || "Comfort"}>
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
              defaultValue={initialEnvelope?.content || ""}
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
