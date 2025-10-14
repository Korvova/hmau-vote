import React from 'react';
import HeaderDropdown from '../components/HeaderDropdown.jsx';
import { logout as apiLogout } from '../utils/api.js';

function ScreenPage() {
	const [configOpen, setConfigOpen] = React.useState(true);

	const handleLogout = async (e) => {
		e?.preventDefault?.();
		try {
			const raw = localStorage.getItem('authUser');
			const auth = raw ? JSON.parse(raw) : null;
			if (auth?.username || auth?.email) await apiLogout(auth.username, auth.email);
		} catch {}
		localStorage.removeItem('authUser');
		window.location.href = '/hmau-vote/login';
	};
	return (
		<>
			{/* HEADER */}
			<header className="page">
				<div className="header__top">
					<div className="container">
						<div className="wrapper">
							<div className="header__logo">
								<div className="logo__inner">
									<a href="/hmau-vote/">
										<img src="/hmau-vote/img/logo.png" alt="" />
									</a>
								</div>
							</div>
							<div className="header__user">
								<div className="user__inner">

									<ul>
										<HeaderDropdown
											trigger={(
												<>
													<img src="/hmau-vote/img/icon_2.png" alt="" />
													{(() => { try { const a = JSON.parse(localStorage.getItem('authUser')||'null'); return a?.name || a?.email || 'admin@admin.ru'; } catch { return 'admin@admin.ru'; } })()}
												</>
											)}
										>
											<li>
												<button type="button" className="logout-button" onClick={handleLogout}>Выйти</button>
											</li>
										</HeaderDropdown>
									</ul>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="header__menu">
					<div className="container">
						<div className="wrapper">
							<ul>
								<li>
									<a href="/hmau-vote/users">Пользователи</a>
								</li>
								<li>
									<a href="/hmau-vote/divisions">Подразделения</a>
								</li>
								<li>
									<a href="/hmau-vote/meetings">Заседания</a>
								</li>
								<li>
									<a href="/hmau-vote/console">Пульт Заседания</a>
								</li>
								<li className={`menu-children current-menu-item`}>
									<a href="#!" onClick={(e) => { e.preventDefault(); setConfigOpen(!configOpen); }}>Конфигурация</a>
									<ul className="sub-menu" style={{ display: configOpen ? 'block' : 'none' }}>
										<li><a href="/hmau-vote/template">Шаблон голосования</a></li>
										<li><a href="/hmau-vote/duration-templates">Шаблоны времени</a></li>
										<li><a href="/hmau-vote/vote">Процедура подсчета голосов</a></li>
										<li className="current-menu-item"><a href="/hmau-vote/screen">Экран трансляции</a></li>
										<li><a href="/hmau-vote/linkprofile">Связать профиль с ID</a></li>
                    <li><a href="/hmau-vote/contacts">Контакты</a></li>
									</ul>
								</li>
							</ul>
						</div>
					</div>
				</div>
			</header>

			{/* MAIN */}
			<main>
				<section id="page">
					<div className="container">
						<div className="wrapper">
							<div className="page__top">
								<div className="top__heading">
									<h1>Экран трансляции</h1>
								</div>
							</div>
							<div className="page__screen">
								<div className="screen__wrapper">
									<div className="screen" style={{ backgroundImage: "url('/img/2.jpg')" }}></div>
								</div>
							</div>
						</div>
					</div>
				</section>
			</main>

			{/* FOOTER */}
			<footer>
				<section id="footer">
					<div className="container">
						<div className="wrapper">
							<p>&copy; rms-group.ru</p>
							<p>RMS Voting 1.2 © 2025</p>
						</div>
					</div>
				</section>
			</footer>
		</>
	);
}

export default ScreenPage;
