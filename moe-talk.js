(function () {
  "use strict";

  var POSTS_KEY = "moeTalkPosts";
  var DRAFT_KEY = "moeTalkDraft";
  var NICKNAME_COOKIE = "moeTalkNickname";
  var VISITOR_COOKIE = "moeTalkVisitor";

  var starterPosts = [
    {
      id: "seed-1",
      nickname: "MoeNeko",
      message: "This web room feels like a comfy late-night visual novel menu screen.",
      createdAt: "2026-03-24T08:10:00.000Z",
      seed: true
    },
    {
      id: "seed-2",
      nickname: "CreamPuffKid",
      message: "I stayed for the pastel colors and now I want strawberry shortcake.",
      createdAt: "2026-03-24T09:20:00.000Z",
      seed: true
    },
    {
      id: "seed-3",
      nickname: "HASUMI",
      message: "Moe Talk unlocked. Please add branch ending where everyone gets cafe coupons.",
      createdAt: "2026-03-24T10:45:00.000Z",
      seed: true
    }
  ];

  function getCookie(name) {
    var parts = document.cookie ? document.cookie.split(";") : [];
    for (var i = 0; i < parts.length; i += 1) {
      var cookie = parts[i].trim();
      if (cookie.indexOf(name + "=") === 0) {
        return decodeURIComponent(cookie.substring(name.length + 1));
      }
    }
    return "";
  }

  function setCookie(name, value, days) {
    var expires = "";
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/; SameSite=Lax";
  }

  function safeParse(jsonText) {
    try {
      var parsed = JSON.parse(jsonText);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function getLocalPosts() {
    return safeParse(localStorage.getItem(POSTS_KEY) || "[]");
  }

  function saveLocalPosts(posts) {
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  }

  function formatDate(isoText) {
    var date = new Date(isoText);
    if (Number.isNaN(date.getTime())) {
      return "just now";
    }
    return date.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderPosts(postListEl) {
    var allPosts = starterPosts.concat(getLocalPosts());
    allPosts.sort(function (a, b) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    if (!allPosts.length) {
      postListEl.innerHTML = "<li class=\"talk-post empty\">No posts yet. Start the thread.</li>";
      return;
    }

    var html = allPosts.map(function (post) {
      var badge = post.seed ? "<span class=\"stamp\">starter</span>" : "<span class=\"stamp\">local</span>";
      return (
        "<li class=\"talk-post\">" +
        "<div class=\"talk-post-head\">" +
        "<strong>" + escapeHtml(post.nickname) + "</strong>" +
        badge +
        "<small>" + formatDate(post.createdAt) + "</small>" +
        "</div>" +
        "<p>" + escapeHtml(post.message) + "</p>" +
        "</li>"
      );
    });

    postListEl.innerHTML = html.join("");
  }

  function run() {
    var form = document.getElementById("moe-talk-form");
    var nicknameInput = document.getElementById("nickname");
    var messageInput = document.getElementById("message");
    var feedbackEl = document.getElementById("talk-feedback");
    var postListEl = document.getElementById("talk-posts");
    var clearButton = document.getElementById("clear-local");

    if (!form || !nicknameInput || !messageInput || !feedbackEl || !postListEl || !clearButton) {
      return;
    }

    var cookieNickname = getCookie(NICKNAME_COOKIE);
    if (cookieNickname) {
      nicknameInput.value = cookieNickname;
    }

    var draft = sessionStorage.getItem(DRAFT_KEY) || "";
    if (draft) {
      messageInput.value = draft;
    }

    if (!getCookie(VISITOR_COOKIE)) {
      setCookie(VISITOR_COOKIE, "1", 30);
    }

    renderPosts(postListEl);

    messageInput.addEventListener("input", function () {
      sessionStorage.setItem(DRAFT_KEY, messageInput.value);
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var nickname = nicknameInput.value.trim();
      var message = messageInput.value.trim();

      if (!nickname) {
        feedbackEl.textContent = "Nickname is required before posting.";
        feedbackEl.className = "talk-feedback error";
        return;
      }

      if (!message) {
        feedbackEl.textContent = "Message cannot be empty.";
        feedbackEl.className = "talk-feedback error";
        return;
      }

      var newPost = {
        id: "local-" + Date.now(),
        nickname: nickname,
        message: message,
        createdAt: new Date().toISOString(),
        seed: false
      };

      var localPosts = getLocalPosts();
      localPosts.push(newPost);
      saveLocalPosts(localPosts);

      setCookie(NICKNAME_COOKIE, nickname, 30);
      sessionStorage.removeItem(DRAFT_KEY);
      messageInput.value = "";

      renderPosts(postListEl);

      feedbackEl.textContent = "Post saved in local browser cache.";
      feedbackEl.className = "talk-feedback success";
    });

    clearButton.addEventListener("click", function () {
      localStorage.removeItem(POSTS_KEY);
      sessionStorage.removeItem(DRAFT_KEY);
      messageInput.value = "";
      renderPosts(postListEl);
      feedbackEl.textContent = "Local posts cleared for this browser.";
      feedbackEl.className = "talk-feedback";
    });
  }

  run();
})();
