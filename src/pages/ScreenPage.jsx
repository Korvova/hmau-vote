import React from 'react';

function ScreenPage() {
	const [configOpen, setConfigOpen] = React.useState(true);
	return (
		<>
			{/* HEADER */}
			<header className="page">
				<div className="header__top">
					<div className="container">
						<div className="wrapper">
							<div className="header__logo">
								<div className="logo__inner">
									<a href="/">
										<img src="/img/logo.png" alt="" />
									</a>
								</div>
							</div>
							<div className="header__user">
								<div className="user__inner">
									<a href="#!" className="support">
										<img src="/img/icon_1.png" alt="" />Поддержка
									</a>
									<ul>
										<li className="menu-children">
											<a href="#!">
												<img src="/img/icon_2.png" alt="" />admin@admin.ru
											</a>
										</li>
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
									<a href="/users">Пользователи</a>
								</li>
								<li>
									<a href="/divisions">Подразделения</a>
								</li>
								<li>
									<a href="/meetings">Заседания</a>
								</li>
								<li>
									<a href="/console">Пульт Заседания</a>
								</li>
								<li className={`menu-children current-menu-item`}>
									<a href="#!" onClick={(e) => { e.preventDefault(); setConfigOpen(!configOpen); }}>Конфигурация</a>
									<ul className="sub-menu" style={{ display: configOpen ? 'block' : 'none' }}>
										<li><a href="/template">Шаблон голосования</a></li>
										<li><a href="/vote">Процедура подсчета голосов</a></li>
										<li className="current-menu-item"><a href="/screen">Экран трансляции</a></li>
										<li><a href="/linkprofile">Связать профиль с ID</a></li>
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
