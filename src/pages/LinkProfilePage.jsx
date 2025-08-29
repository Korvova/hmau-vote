import React from 'react';

function LinkProfilePage() {
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
										<li><a href="/screen">Экран трансляции</a></li>
										<li className="current-menu-item"><a href="/linkprofile">Связать профиль с ID</a></li>
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
									<h1>Связать профиль с ID</h1>
									<a href="#!" className="btn btn-add"><span>Добавить</span></a>
								</div>
								<div className="top__wrapper">
									<form className="search">
										<input type="text" placeholder="Поиск" />
										<button type="submit"></button>
									</form>
								</div>
							</div>
							<div className="page__table page__table-profile">
								<table>
									<thead>
										<tr>
											<th>Пользователь</th>
											<th>ID устройства</th>
											<th>Действие</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td className="select-name">
												<select>
													<option value="Иванов Н. А.">Иванов Н. А.</option>
													<option value="Иванов Н. Б.">Иванов Н. Б.</option>
													<option value="Иванов Н. В.">Иванов Н. В.</option>
												</select>
											</td>
											<td className="input-id"><input type="text" defaultValue="124779" /></td>
											<td className="action action-small">
												<ul>
													<li><a href="#!"><img src="/img/icon_29.png" alt="" /></a></li>
													<li><a href="#!"><img src="/img/icon_26.png" alt="" /></a></li>
												</ul>
											</td>
										</tr>
										<tr>
											<td className="select-name">
												<select>
													<option value="Иванов Н. А.">Иванов Н. А.</option>
													<option value="Иванов Н. Б.">Иванов Н. Б.</option>
													<option value="Иванов Н. В.">Иванов Н. В.</option>
												</select>
											</td>
											<td className="input-id"><input type="text" defaultValue="124779" /></td>
											<td className="action action-small">
												<ul>
													<li><a href="#!"><img src="/img/icon_29.png" alt="" /></a></li>
													<li><a href="#!"><img src="/img/icon_26.png" alt="" /></a></li>
												</ul>
											</td>
										</tr>
										<tr>
											<td className="select-name">
												<select>
													<option value="Иванов Н. А.">Иванов Н. А.</option>
													<option value="Иванов Н. Б.">Иванов Н. Б.</option>
													<option value="Иванов Н. В.">Иванов Н. В.</option>
												</select>
											</td>
											<td className="input-id"><input type="text" defaultValue="124779" /></td>
											<td className="action action-small">
												<ul>
													<li><a href="#!"><img src="/img/icon_29.png" alt="" /></a></li>
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
							<p>RMS Voting 1.01 – 2025</p>
						</div>
					</div>
				</section>
			</footer>
		</>
	);
}

export default LinkProfilePage;
