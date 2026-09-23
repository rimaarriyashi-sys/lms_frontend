"use client";

export default function Home() {
  return (
    <main className="page">

      {/* ================= HEADER ================= */}
      <header className="header">
        <div className="logo-area">
          <div className="logo-icon">🎓</div>
          <div>
            <h2>EduLearn</h2>
            <span>LMS Sekolah</span>
          </div>
        </div>

        <nav className="navbar">
          <a href="#beranda">Beranda</a>
          <a href="#fitur">Fitur</a>
          <a href="#tentang">Tentang Kami</a>
          <a href="#kontak">Kontrak</a>
        </nav>

        <button className="login-button">↪ &nbsp; Masuk</button>
      </header>


      {/* ================= HERO ================= */}
      <section className="hero" id="beranda">
        <div className="hero-content">

          <h1>
            Kelola, Belajar.
            <br />
            Kolaborasi, Berkembang.
          </h1>

          <p>
            Satu platform terintegrasi untuk mengelola pembelajaran,
            meningkatkan kolaborasi, dan menyediakan informasi akademik
            secara terstruktur.
          </p>

          <span className="hero-small">
            Aman. Terstruktur. Terintegrasi.
          </span>

          <button className="hero-button">
            ↪ &nbsp; Masuk
          </button>

        </div>

        <div className="hero-image">
          <div className="laptop">
            <div className="laptop-screen">
              <div className="screen-header"></div>
              <div className="screen-content">
                <div className="chart chart-one"></div>
                <div className="chart chart-two"></div>
                <div className="chart chart-three"></div>
              </div>
            </div>
            <div className="laptop-base"></div>
          </div>

          <div className="books">
            📚
          </div>

          <div className="plant">
            🪴
          </div>
        </div>
      </section>


      {/* ================= FITUR ================= */}
      <section className="features-section" id="fitur">

        <div className="section-label">
          FITUR UNGGULAN
        </div>

        <h2 className="section-title">
          Semua yang Anda Butuhkan dalam Satu Platform
        </h2>

        <div className="features">

          <div className="feature-card">
            <div className="feature-icon">📋</div>
            <h3>Manajemen Terpadu</h3>
            <p>
              Kelola data siswa, guru, kelas,
              dan aktivitas pembelajaran secara
              terintegrasi.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📚</div>
            <h3>Pembelajaran Efektif</h3>
            <p>
              Buat materi, tugas, ujian,
              dan pembelajaran dengan mudah.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Kolaborasi Nyata</h3>
            <p>
              Membangun interaksi antara siswa,
              guru, dan seluruh warga sekolah.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📄</div>
            <h3>Pemantauan Mudah</h3>
            <p>
              Pantau aktivitas belajar,
              perkembangan siswa, dan hasil belajar.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📢</div>
            <h3>Aman & Terpercaya</h3>
            <p>
              Data dan informasi tersimpan
              dengan sistem keamanan yang baik.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔗</div>
            <h3>Akses Fleksibel</h3>
            <p>
              Akses informasi dan pembelajaran
              kapan saja dan di mana saja.
            </p>
          </div>

        </div>
      </section>


      {/* ================= STATISTIK ================= */}
      <section className="statistics">

        <div className="stat-item">
          <div className="stat-icon">👥</div>
          <div>
            <strong>1.250+</strong>
            <span>Siswa Aktif</span>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon">👨‍🏫</div>
          <div>
            <strong>85+</strong>
            <span>Guru Aktif</span>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon">🏫</div>
          <div>
            <strong>36+</strong>
            <span>Kelas Aktif</span>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon">📖</div>
          <div>
            <strong>250+</strong>
            <span>Materi Tersedia</span>
          </div>
        </div>

      </section>


      {/* ================= FOOTER ================= */}
      <footer className="footer" id="kontak">

        <div className="footer-brand">

          <div className="footer-logo">
            <div className="logo-icon">🎓</div>

            <div>
              <h2>EduLearn</h2>
              <span>LMS Sekolah</span>
            </div>
          </div>

          <p>
            Platform pembelajaran yang terintegrasi
            untuk mendukung proses pendidikan yang
            efektif dan efisien.
          </p>

          <div className="social-media">
            <span>f</span>
            <span>◎</span>
            <span>▶</span>
          </div>

        </div>


        <div className="footer-column">
          <h3>Menu</h3>
          <a href="#beranda">Beranda</a>
          <a href="#fitur">Fitur</a>
          <a href="#tentang">Tentang Kami</a>
          <a href="#kontak">Kontak</a>
        </div>


        <div className="footer-column">
          <h3>Bantuan</h3>
          <a href="#">Panduan Pengguna</a>
          <a href="#">FAQ</a>
          <a href="#">Kebijakan Privasi</a>
          <a href="#">Syarat & Ketentuan</a>
        </div>


        <div className="footer-column">
          <h3>Hubungi Kami</h3>
          <p>✉ info@edulearn.id</p>
          <p>☎ 0821-3456-7890</p>
          <p>📍 Depok, Jawa Barat</p>
        </div>


        <div className="footer-school">
          <div className="school-building">
            🏫
          </div>
        </div>

      </footer>

    </main>
  );
}