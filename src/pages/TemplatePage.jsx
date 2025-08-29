import React from 'react';

function TemplatePage() {
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
										<li className="current-menu-item"><a href="/template">Шаблон голосования</a></li>
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
				<section id="page">
					<div className="container">
						<div className="wrapper">
							<div className="page__top">
								<div className="top__heading">
									<h1>Шаблон голосования</h1>
									<a href="#!" className="btn btn-add"><span>Добавить</span></a>
								</div>
								<div className="top__wrapper">
									<select>
										<option value="По дате">По дате</option>
										<option value="По дате 1">По дате 1</option>
										<option value="По дате 2">По дате 2</option>
									</select>
									<form className="search">
										<input type="text" placeholder="Поиск" />
										<button type="submit"></button>
									</form>
								</div>
							</div>
							<div className="page__table">
								<table>
									<thead>
										<tr>
											<th>Название</th>
											<th>Действие</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td>Внесение изменений в Устав (полномочия комиссий)</td>
											<td className="action">
												<ul>
													<li><a href="#!"><img src="/img/icon_24.png" alt="" /></a></li>
													<li><a href="#!"><img src="/img/icon_25.png" alt="" /></a></li>
													<li><a href="#!"><img src="/img/icon_26.png" alt="" /></a></li>
												</ul>
											</td>
										</tr>
										<tr>
											<td>Внесение изменений в Устав (полномочия комиссий)</td>
											<td className="action">
												<ul>
													<li><a href="#!"><img src="/img/icon_24.png" alt="" /></a></li>
													<li><a href="#!"><img src="/img/icon_25.png" alt="" /></a></li>
													<li><a href="#!"><img src="/img/icon_26.png" alt="" /></a></li>
												</ul>
											</td>
										</tr>
										<tr>
											<td>Утверждение графика работы (Проект 1)</td>
											<td className="action">
												<ul>
													<li><a href="#!"><img src="/img/icon_24.png" alt="" /></a></li>
													<li><a href="#!"><img src="/img/icon_25.png" alt="" /></a></li>
													<li><a href="#!"><img src="/img/icon_26.png" alt="" /></a></li>
												</ul>
											</td>
										</tr>
										<tr>
											<td>Внесение изменений в Устав (полномочия комиссий)</td>
											<td className="action">
												<ul>
													<li><a href="#!"><img src="/img/icon_24.png" alt="" /></a></li>
													<li><a href="#!"><img src="/img/icon_25.png" alt="" /></a></li>
													<li><a href="#!"><img src="/img/icon_26.png" alt="" /></a></li>
												</ul>
											</td>
										</tr>
										<tr>
											<td>Внесение изменений в Устав (полномочия комиссий)</td>
											<td className="action">
												<ul>
													<li><a href="#!"><img src="/img/icon_24.png" alt="" /></a></li>
													<li><a href="#!"><img src="/img/icon_25.png" alt="" /></a></li>
													<li><a href="#!"><img src="/img/icon_26.png" alt="" /></a></li>
												</ul>
											</td>
										</tr>
									</tbody>
								</table>
							</div>
							<div className="pagination">
								<div className="wp-pagenavi">
									<a href="#" className="previouspostslink"></a>
									<a href="#">1</a>
									<span>2</span>
									<a href="#">3</a>
									<a href="#">4</a>
									<a href="#" className="nextpostslink"></a>
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
							<p>RMS Voting 1.2 – 2025</p>
						</div>
					</div>
				</section>
			</footer>
		</>
	);
}

export default TemplatePage;
