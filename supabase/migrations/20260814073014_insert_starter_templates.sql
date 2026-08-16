insert into templates (name, category, html_structure, css, is_premium) values

(
  'Key Statistic',
  'stat-highlight',
  '<div class="card">
  <div class="card-accent editable-accent"></div>
  <div class="card-content">
    <div class="card-kicker editable-accent">KEY STATISTIC</div>
    <div class="stat-group">
      <div class="stat-number editable-heading">87%</div>
      <div class="stat-label editable-body">of users prefer a simpler experience.</div>
    </div>
    <div class="card-footer">
      <div class="footer-mark editable-accent"></div>
      <div class="footer-text editable-body">HTTI.Studio</div>
    </div>
  </div>
</div>',
  '* { box-sizing: border-box; }
.card { position: relative; width: 500px; height: 500px; overflow: hidden; background: #ffffff; color: #111111; font-family: Arial, Helvetica, sans-serif; }
.card-accent { position: absolute; top: 0; left: 0; width: 100%; height: 10px; background: #3D5AFE; }
.card-content { position: relative; min-height: 100%; padding: 58px 55px 48px; display: flex; flex-direction: column; }
.card-kicker { display: inline-block; align-self: flex-start; color: #3D5AFE; font-size: 13px; font-weight: 800; letter-spacing: 2px; line-height: 1.4; text-transform: uppercase; }
.stat-group { margin-top: 70px; max-width: 390px; }
.stat-number { color: #111111; font-size: 112px; font-weight: 900; letter-spacing: -6px; line-height: 0.95; overflow-wrap: break-word; }
.stat-label { max-width: 360px; margin-top: 22px; color: #444444; font-size: 24px; font-weight: 600; line-height: 1.25; overflow-wrap: break-word; }
.card-footer { display: flex; align-items: center; gap: 12px; margin-top: auto; padding-top: 35px; }
.footer-mark { width: 28px; height: 4px; flex: 0 0 28px; border-radius: 99px; background: #3D5AFE; }
.footer-text { color: #777777; font-size: 13px; font-weight: 700; letter-spacing: 0.8px; line-height: 1.4; overflow-wrap: break-word; }
.editable-heading, .editable-body, .editable-accent { overflow-wrap: break-word; word-break: normal; }',
  false
),

(
  'Thought of the Day',
  'quote',
  '<div class="card">
  <div class="card-background"></div>
  <div class="card-content">
    <div class="editable-accent card-label">THOUGHT OF THE DAY</div>
    <div class="quote-mark editable-accent">"</div>
    <div class="editable-heading quote">Your quote goes here.</div>
    <div class="quote-footer">
      <div class="quote-line editable-accent"></div>
      <div class="editable-body author">— Author Name</div>
    </div>
  </div>
  <div class="shape shape-one"></div>
  <div class="shape shape-two"></div>
  <div class="shape shape-three"></div>
</div>',
  '* { box-sizing: border-box; }
.card { position: relative; width: 500px; height: 500px; overflow: hidden; background: #fff1e8; color: #24150f; font-family: Arial, Helvetica, sans-serif; }
.card-background { position: absolute; inset: 0; background: radial-gradient(circle at 15% 15%, rgba(255, 107, 53, 0.22), transparent 34%), radial-gradient(circle at 90% 85%, rgba(255, 177, 122, 0.35), transparent 38%), linear-gradient(135deg, #fff5ed 0%, #ffd8c2 48%, #fff0e5 100%); }
.card-content { position: relative; z-index: 2; min-height: 100%; padding: 58px 55px; display: flex; flex-direction: column; justify-content: center; }
.card-label { align-self: flex-start; margin-bottom: 28px; padding: 8px 14px; border-radius: 999px; background: #ff6b35; color: #ffffff; font-size: 12px; font-weight: 700; letter-spacing: 1.6px; line-height: 1.2; }
.quote-mark { margin-bottom: 8px; color: #ff6b35; font-family: Georgia, "Times New Roman", serif; font-size: 76px; font-weight: 700; line-height: 0.7; }
.quote { max-width: 390px; margin: 0; font-family: Georgia, "Times New Roman", serif; font-size: 38px; font-weight: 700; line-height: 1.15; letter-spacing: -0.8px; overflow-wrap: break-word; }
.quote-footer { display: flex; align-items: center; gap: 12px; margin-top: 34px; }
.quote-line { flex: 0 0 38px; width: 38px; height: 3px; border-radius: 99px; background: #ff6b35; }
.author { max-width: 300px; color: #5a3a2d; font-size: 15px; font-weight: 600; line-height: 1.4; overflow-wrap: break-word; }
.shape { position: absolute; z-index: 1; border-radius: 50%; pointer-events: none; }
.shape-one { width: 210px; height: 210px; top: -90px; right: -65px; background: rgba(255, 107, 53, 0.24); }
.shape-two { width: 150px; height: 150px; bottom: -70px; left: -55px; background: rgba(255, 255, 255, 0.42); }
.shape-three { width: 70px; height: 70px; right: 55px; bottom: 45px; background: rgba(255, 107, 53, 0.16); }
.editable-heading, .editable-body, .editable-accent { overflow-wrap: break-word; word-break: normal; }',
  false
),

(
  '3 Things Worth Knowing',
  'tips',
  '<div class="card">
  <div class="card-header">
    <div class="editable-accent card-eyebrow">FIELD NOTES</div>
    <div class="editable-heading card-title">3 Things Worth Knowing</div>
    <div class="editable-body card-intro">Simple ideas that can make a meaningful difference.</div>
  </div>
  <div class="tips">
    <div class="tip">
      <div class="editable-accent tip-number">01</div>
      <div class="tip-content">
        <div class="editable-heading tip-title">Start Small</div>
        <div class="editable-body tip-text">Focus on one useful improvement at a time.</div>
      </div>
    </div>
    <div class="tip">
      <div class="editable-accent tip-number">02</div>
      <div class="tip-content">
        <div class="editable-heading tip-title">Stay Consistent</div>
        <div class="editable-body tip-text">Small actions become powerful when repeated.</div>
      </div>
    </div>
    <div class="tip">
      <div class="editable-accent tip-number">03</div>
      <div class="tip-content">
        <div class="editable-heading tip-title">Keep Learning</div>
        <div class="editable-body tip-text">Curiosity keeps your skills moving forward.</div>
      </div>
    </div>
  </div>
  <div class="card-footer">
    <div class="editable-body footer-brand">HTTI.Studio</div>
    <div class="editable-accent footer-mark"></div>
  </div>
</div>',
  '* { box-sizing: border-box; }
.card { position: relative; width: 500px; height: 500px; overflow: hidden; padding: 42px 44px 34px; display: flex; flex-direction: column; background: #f7f4ed; color: #1a1a1a; font-family: Georgia, "Times New Roman", serif; }
.card-header { padding-bottom: 25px; border-bottom: 1px solid rgba(26, 26, 26, 0.22); }
.card-eyebrow { margin-bottom: 13px; color: #a47b27; font-family: Arial, Helvetica, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 2px; line-height: 1.3; text-transform: uppercase; }
.card-title { max-width: 390px; font-size: 38px; font-weight: 700; line-height: 1.05; letter-spacing: -1px; overflow-wrap: break-word; }
.card-intro { max-width: 390px; margin-top: 12px; color: #55504a; font-size: 15px; line-height: 1.4; overflow-wrap: break-word; }
.tips { display: flex; flex-direction: column; gap: 17px; padding-top: 23px; }
.tip { display: flex; align-items: flex-start; gap: 18px; }
.tip-number { flex: 0 0 auto; min-width: 28px; color: #a47b27; font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 800; line-height: 1.5; }
.tip-content { flex: 1; min-width: 0; }
.tip-title { font-size: 18px; font-weight: 700; line-height: 1.2; overflow-wrap: break-word; }
.tip-text { margin-top: 3px; color: #4d4944; font-size: 14px; line-height: 1.35; overflow-wrap: break-word; }
.card-footer { display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 20px; }
.footer-brand { color: #6b665f; font-family: Arial, Helvetica, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 1px; }
.footer-mark { width: 34px; height: 3px; background: #a47b27; }
.editable-heading, .editable-body, .editable-accent { overflow-wrap: break-word; word-break: normal; }',
  false
),

(
  'Live Event',
  'event-promo',
  '<div class="card">
  <div class="geometric-shape shape-top"></div>
  <div class="geometric-shape shape-bottom"></div>
  <div class="card-content">
    <div class="event-label editable-accent">LIVE EVENT</div>
    <div class="event-date">
      <div class="date-day editable-heading">24</div>
      <div class="date-details">
        <div class="date-month editable-accent">AUG</div>
        <div class="date-year editable-body">2026</div>
      </div>
    </div>
    <div class="event-info">
      <div class="event-title editable-heading">The Future of Digital Design</div>
      <div class="event-location">
        <span class="location-icon editable-accent">●</span>
        <span class="location-text editable-body">Lagos, Nigeria</span>
      </div>
    </div>
    <div class="card-footer">
      <div class="footer-brand editable-body">HTTI.Studio</div>
      <div class="footer-line editable-accent"></div>
    </div>
  </div>
</div>',
  '* { box-sizing: border-box; }
.card { position: relative; width: 500px; height: 500px; overflow: hidden; background: #111111; color: #ffffff; font-family: Arial, Helvetica, sans-serif; }
.card-content { position: relative; z-index: 3; min-height: 100%; padding: 42px 44px 34px; display: flex; flex-direction: column; }
.event-label { align-self: flex-start; color: #8B5CF6; font-size: 12px; font-weight: 800; letter-spacing: 2px; line-height: 1.3; }
.event-date { display: flex; align-items: center; gap: 12px; margin-top: 42px; }
.date-day { color: #ffffff; font-size: 88px; font-weight: 900; letter-spacing: -5px; line-height: 0.9; overflow-wrap: break-word; }
.date-details { display: flex; flex-direction: column; gap: 4px; }
.date-month { color: #8B5CF6; font-size: 17px; font-weight: 900; letter-spacing: 2px; line-height: 1.1; }
.date-year { color: #a9a9a9; font-size: 13px; font-weight: 700; letter-spacing: 1px; line-height: 1.3; }
.event-info { margin-top: 38px; max-width: 390px; }
.event-title { color: #ffffff; font-size: 42px; font-weight: 900; line-height: 1.02; letter-spacing: -1.5px; overflow-wrap: break-word; }
.event-location { display: flex; align-items: center; gap: 9px; margin-top: 24px; }
.location-icon { color: #8B5CF6; font-size: 12px; line-height: 1; }
.location-text { color: #d0d0d0; font-size: 15px; font-weight: 600; line-height: 1.4; overflow-wrap: break-word; }
.card-footer { display: flex; align-items: center; gap: 14px; margin-top: auto; padding-top: 28px; }
.footer-brand { color: #888888; font-size: 11px; font-weight: 800; letter-spacing: 1px; }
.footer-line { width: 42px; height: 3px; border-radius: 99px; background: #8B5CF6; }
.geometric-shape { position: absolute; z-index: 1; pointer-events: none; }
.shape-top { width: 260px; height: 260px; top: -150px; right: -90px; background: #8B5CF6; transform: rotate(45deg); }
.shape-bottom { width: 190px; height: 190px; bottom: -125px; left: -75px; background: #8B5CF6; transform: rotate(45deg); opacity: 0.35; }
.editable-heading, .editable-body, .editable-accent { overflow-wrap: break-word; word-break: normal; }',
  true
),

(
  'Something New',
  'announcement',
  '<div class="card">
  <div class="glow glow-top"></div>
  <div class="glow glow-bottom"></div>
  <div class="card-content">
    <div class="announcement-label editable-accent">ANNOUNCEMENT</div>
    <div class="announcement-icon editable-accent">!</div>
    <div class="announcement-content">
      <div class="announcement-title editable-heading">Something New Is Coming</div>
      <div class="announcement-description editable-body">We have been working behind the scenes on something special. Stay tuned for the official reveal.</div>
    </div>
    <div class="announcement-footer">
      <div class="footer-brand editable-body">HTTI.Studio</div>
      <div class="footer-status">
        <span class="status-dot editable-accent"></span>
        <span class="status-text editable-accent">NEW</span>
      </div>
    </div>
  </div>
</div>',
  '* { box-sizing: border-box; }
.card { position: relative; width: 500px; height: 500px; overflow: hidden; background: #090d0b; color: #f5f7f6; font-family: Arial, Helvetica, sans-serif; border: 1px solid rgba(16, 185, 129, 0.25); }
.card-content { position: relative; z-index: 3; min-height: 100%; padding: 48px 46px 38px; display: flex; flex-direction: column; }
.announcement-label { align-self: flex-start; color: #10B981; font-size: 11px; font-weight: 800; letter-spacing: 2.5px; line-height: 1.3; }
.announcement-icon { width: 62px; height: 62px; margin-top: 55px; display: flex; align-items: center; justify-content: center; border: 2px solid #10B981; border-radius: 16px; color: #10B981; font-size: 34px; font-weight: 800; line-height: 1; box-shadow: 0 0 24px rgba(16, 185, 129, 0.18); }
.announcement-content { max-width: 390px; margin-top: 28px; }
.announcement-title { color: #ffffff; font-size: 42px; font-weight: 850; line-height: 1.03; letter-spacing: -1.5px; overflow-wrap: break-word; }
.announcement-description { max-width: 370px; margin-top: 18px; color: #aeb8b4; font-size: 16px; font-weight: 400; line-height: 1.5; overflow-wrap: break-word; }
.announcement-footer { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-top: auto; padding-top: 30px; }
.footer-brand { color: #68736e; font-size: 11px; font-weight: 700; letter-spacing: 1px; }
.footer-status { display: flex; align-items: center; gap: 7px; }
.status-dot { width: 7px; height: 7px; border-radius: 50%; background: #10B981; box-shadow: 0 0 10px rgba(16, 185, 129, 0.75); }
.status-text { color: #10B981; font-size: 10px; font-weight: 800; letter-spacing: 1.5px; }
.glow { position: absolute; z-index: 1; border-radius: 50%; pointer-events: none; filter: blur(10px); }
.glow-top { width: 240px; height: 240px; top: -150px; right: -90px; background: rgba(16, 185, 129, 0.18); }
.glow-bottom { width: 180px; height: 180px; bottom: -120px; left: -80px; background: rgba(16, 185, 129, 0.10); }
.editable-heading, .editable-body, .editable-accent { overflow-wrap: break-word; word-break: normal; }',
  true
);