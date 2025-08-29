import React from 'react';

function HomePage() {
	const [configOpen, setConfigOpen] = React.useState(false);
	return (
		<>
			{/* HEADER */}
			<header>
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
								<li className={`menu-children${configOpen ? ' current-menu-item' : ''}`}>
									<a href="#!" onClick={(e) => { e.preventDefault(); setConfigOpen(!configOpen); }}>Конфигурация</a>
									<ul className="sub-menu" style={{ display: configOpen ? 'block' : 'none' }}>
										<li><a href="/template">Шаблон голосования</a></li>
										<li><a href="/vote">Процедура подсчета голосов</a></li>
										<li><a href="/screen">Экран трансляции</a></li>
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
				<section id="mainblock">
					<div className="container">
						<div className="wrapper">
							<h2>
								Добро <br />пожаловать, <br />admin!
							</h2>
						</div>
					</div>
				</section>
				<section id="meetingsusers">
					<div className="container">
						<div className="wrapper">
							<div className="item">
								<h3>Заседания</h3>
								<ul className="nav">
									<li>
										<a href="#!" className="active">Все</a>
									</li>
									<li><a href="#!">Активные</a></li>
									<li><a href="#!">Завершенные</a></li>
								</ul>
								<table>
									<tbody>
										<tr>
											<td>Заседание по актуальным вопросам</td>
											<td className="date">17.07.2025</td>
										</tr>
										<tr>
											<td>Доработка Устава</td>
											<td className="date">17.07.2025</td>
										</tr>
										<tr>
											<td>Заседание по актуальным вопросам</td>
											<td className="date">17.07.2025</td>
										</tr>
									</tbody>
								</table>
								<div className="box__buttons">
									<a href="/meetings" className="link">Перейти в раздел</a>
									<a href="#!" className="btn btn-border">Добавить</a>
								</div>
							</div>
							<div className="item item-users">
								<h3>Пользователи</h3>
								<table>
									<tbody>
										<tr>
											<td>Петрова А. Л.</td>
											<td className="email">petrova@mail.ru</td>
											<td className="state state-off"><span></span></td>
										</tr>
										<tr>
											<td>Иванов Р. А.</td>
											<td className="email">ivanov@mail.ru</td>
											<td className="state state-on"><span></span></td>
										</tr>
										<tr>
											<td>Сидоров Ф. С.</td>
											<td className="email">sidorov-f-s@mail.ru</td>
											<td className="state state-off"><span></span></td>
										</tr>
										<tr>
											<td>Петрова А. Л.</td>
											<td className="email">petrova@mail.ru</td>
											<td className="state state-off"><span></span></td>
										</tr>
									</tbody>
								</table>
								<div className="box__buttons">
									<a href="/users" className="link">Перейти в раздел</a>
									<a href="#!" className="btn btn-border">Добавить</a>
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
							<p>RMS Voting 1.01 – 2025</p>
						</div>
					</div>
				</section>
			</footer>
		</>
	);
}

export default HomePage;
