import React from 'react';

function UsersPage() {
	const [configOpen, setConfigOpen] = React.useState(false);
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
								<li className="current-menu-item">
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
				<section id="page">
					<div className="container">
						<div className="wrapper">
							<div className="page__top">
								<div className="top__heading">
									<h1>Пользователи</h1>
									<a href="#!" className="btn btn-add"><span>Добавить</span></a>
								</div>
								<div className="top__wrapper">
									<select>
										<option value="По подразделению">По подразделению</option>
										<option value="По подразделению 1">По подразделению 1</option>
										<option value="По подразделени 2">По подразделению 2</option>
									</select>
									<form className="search">
										<input type="text" placeholder="Поиск" />
										<button type="submit"></button>
									</form>
									<ul className="nav">
										<li><a href="#!"><img src="/img/icon_8.png" alt="" /></a></li>
										<li><a href="#!"><img src="/img/icon_9.png" alt="" /></a></li>
									</ul>
								</div>
							</div>
							<div className="page__table">
								<table>
									<thead>
										<tr>
											<th>ФИО</th>
											<th>E-mail</th>
											<th>Моб. телефон</th>
											<th>Подразделение</th>
											<th className="th-state">Статус</th>
											<th></th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td>Петров Иван Сергеевич</td>
											<td>petrov@mail.ru</td>
											<td>+7 904 245 67 77</td>
											<td>Отдел маркетинга</td>
											<td className="state state-off"><span></span></td>
											<td className="user__nav">
												<button className="user__button"><img src="/img/icon_10.png" alt="" /></button>
												<ul className="nav__links">
													<li><button data-fancybox="" data-src="#modal-user-edit"><img src="/img/icon_11.png" alt="" />Редактировать</button></li>
													<li><button><img src="/img/icon_12.png" alt="" />Заблокировать</button></li>
													<li><button><img src="/img/icon_13.png" alt="" />В архив</button></li>
													<li><button><img src="/img/icon_14.png" alt="" />Удалить</button></li>
												</ul>
											</td>
										</tr>
										<tr>
											<td>Сидорова Елена Андреевна</td>
											<td>petrov@mail.ru</td>
											<td>+7 904 245 67 77</td>
											<td>Отдел маркетинга</td>
											<td className="state state-on"><span></span></td>
											<td className="user__nav">
												<button className="user__button"><img src="/img/icon_10.png" alt="" /></button>
												<ul className="nav__links">
													<li><button data-fancybox="" data-src="#modal-user-edit"><img src="/img/icon_11.png" alt="" />Редактировать</button></li>
													<li><button><img src="/img/icon_12.png" alt="" />Заблокировать</button></li>
													<li><button><img src="/img/icon_13.png" alt="" />В архив</button></li>
													<li><button><img src="/img/icon_14.png" alt="" />Удалить</button></li>
												</ul>
											</td>
										</tr>
										<tr>
											<td>Иванов Вениамин Владимирович</td>
											<td>petrov@mail.ru</td>
											<td>+7 904 245 67 77</td>
											<td>Отдел маркетинга</td>
											<td className="state state-off"><span></span></td>
											<td className="user__nav">
												<button className="user__button"><img src="/img/icon_10.png" alt="" /></button>
												<ul className="nav__links">
													<li><button data-fancybox="" data-src="#modal-user-edit"><img src="/img/icon_11.png" alt="" />Редактировать</button></li>
													<li><button><img src="/img/icon_12.png" alt="" />Заблокировать</button></li>
													<li><button><img src="/img/icon_13.png" alt="" />В архив</button></li>
													<li><button><img src="/img/icon_14.png" alt="" />Удалить</button></li>
												</ul>
											</td>
										</tr>
										<tr>
											<td>Петров Иван Сергеевич</td>
											<td>petrov@mail.ru</td>
											<td>+7 904 245 67 77</td>
											<td>Отдел маркетинга</td>
											<td className="state state-off"><span></span></td>
											<td className="user__nav">
												<button className="user__button"><img src="/img/icon_10.png" alt="" /></button>
												<ul className="nav__links">
													<li><button data-fancybox="" data-src="#modal-user-edit"><img src="/img/icon_11.png" alt="" />Редактировать</button></li>
													<li><button><img src="/img/icon_12.png" alt="" />Заблокировать</button></li>
													<li><button><img src="/img/icon_13.png" alt="" />В архив</button></li>
													<li><button><img src="/img/icon_14.png" alt="" />Удалить</button></li>
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

				{/* modal-user-edit */}
				<div style={{ display: 'none' }} id="modal-user-edit" className="modal">
					<div className="modal__heading center">
						<h2>Редактировать пользователя</h2>
					</div>
					<div className="form__inner">
						<form>
							<div className="form__item">
								<div className="item__title">ФИО <sup>*</sup></div>
								<input type="text" placeholder="" defaultValue="Петров Иван Сергеевич" required />
							</div>
							<div className="form__wrapper">
								<div className="form__item">
									<div className="item__title">E-mail <sup>*</sup></div>
									<input type="text" placeholder="" defaultValue="petrov@mail.ru" required />
								</div>
								<div className="form__item">
									<div className="item__title">Телефон <sup>*</sup></div>
									<input type="text" placeholder="" defaultValue="+7 905 989 29 28" required />
								</div>
							</div>
							<div className="form__item">
								<div className="item__title">Подразделение</div>
								<input type="text" placeholder="" defaultValue="Без подразделения" />
							</div>
							<div className="form__submit">
								<input type="text" className="pass" placeholder="Пароль" required />
								<button type="submit" className="btn btn-big">Применить</button>
							</div>
						</form>
					</div>
				</div>
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

export default UsersPage;
