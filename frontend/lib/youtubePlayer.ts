/**
 * YouTube player HTML generator for WebView embedding.
 * Uses the YouTube IFrame Player API with proper origin handling
 * to avoid Error 152-4 (embedding restricted).
 *
 * If a video is unavailable, falls back to a "Watch on YouTube" button.
 */

export function getYouTubeHTML(videoId: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    #player { width: 100%; height: 100%; }
    #fallback {
      display: none;
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      flex-direction: column;
      justify-content: center; align-items: center;
      background: #000;
    }
    #fallback.show { display: flex; }
    #fallback a {
      color: #C8A96E; text-decoration: none;
      font-family: -apple-system, sans-serif;
      font-size: 15px; font-weight: 600;
      border: 2px solid #C8A96E;
      padding: 14px 28px; border-radius: 12px;
      margin-top: 16px;
    }
    #fallback p {
      color: #999; font-family: -apple-system, sans-serif;
      font-size: 12px; margin-top: 8px;
    }
  </style>
</head>
<body>
  <div id="player"></div>
  <div id="fallback">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C8A96E" stroke-width="2">
      <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>
    <a href="https://www.youtube.com/watch?v=${videoId}">Watch on YouTube</a>
    <p>Video cannot be embedded — tap above to watch</p>
  </div>
  <script>
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);

    var player;
    var retryCount = 0;

    function onYouTubeIframeAPIReady() {
      player = new YT.Player('player', {
        videoId: '${videoId}',
        playerVars: {
          autoplay: 1,
          playsinline: 1,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          controls: 1,
          fs: 1,
          origin: 'https://www.youtube.com'
        },
        events: {
          onReady: function(e) { e.target.playVideo(); },
          onError: function(e) {
            // Error codes: 2=invalid param, 5=HTML5 error, 100=not found, 101/150=embed restricted
            if (retryCount < 1) {
              retryCount++;
              // Try reloading with a slight delay
              setTimeout(function() {
                player.loadVideoById('${videoId}');
              }, 1000);
            } else {
              document.getElementById('fallback').className = 'show';
              document.getElementById('player').style.display = 'none';
            }
          }
        }
      });
    }

    // Timeout fallback — if API doesn't load in 8s, show fallback
    setTimeout(function() {
      if (!player) {
        document.getElementById('fallback').className = 'show';
        document.getElementById('player').style.display = 'none';
      }
    }, 8000);
  </script>
</body>
</html>`;
}

/**
 * Generates a list of fallback video IDs for a given exercise category.
 * If the primary video fails, the next one is tried.
 */
export const FALLBACK_VIDEOS: Record<string, string[]> = {
  // Jaw & Face
  mewing: ['zbZwLFBsOiM', 'BaNXMq0fmEo', 'eh2k_AC4EYo'],
  'tongue posture': ['zbZwLFBsOiM', 'BaNXMq0fmEo'],
  'jawline exercise': ['GEUF2v-6OUo', '8p0CPiIMF50'],
  'chin tuck': ['k3mqkYDkPsk', '2MJGi-hZ2to'],

  // Body
  'push up': ['IODxDxX7oi4', '_l3ySVKYVJ8', 'jWxvty2KROs'],
  'pull up': ['eGo4IYlbE5g', 'poyr8KenUfc', 'XB_7En-zf_M'],
  squat: ['ultWZbUMPL8', 'gsNoPYwWX0M', 'nEQQle9GflA'],
  deadlift: ['op9kVnSso6Q', 'AweC3UaM14o', 'ytGaGIn3SjE'],
  'bench press': ['vcBig73ojpE', 'rT7DgCr-3pg', '4Y2ZdHCOXok'],
  'bicep curl': ['ykJmrZ5v0Oo', 'in7PaeYlhrM', 'kwG2ipFRgFo'],
  plank: ['ASdvN_XEl_c', 'pvIjsG5Svck', 'B296mZDhrP4'],
  'face pull': ['HSoHeSjovGc', 'rep-qVOkqgk', 'eIq5CB9JfKE'],
  'overhead press': ['2yjwXTZQDDI', '_RlRDWO2jfg', 'QAQ64hK4Xxs'],
  'lateral raise': ['3VcKaXpzqRo', 'XPPfnSEATJA', 'kDqklk1ZESo'],
  'wall stand': ['RqcOCBb4arc', 'zQIr85G3BIg'],
  'cold shower': ['pq6WHJzOkno', 'AjxopeAiMrM'],
};
