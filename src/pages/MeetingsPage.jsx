import React from 'react';

function MeetingsPage() {
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
								<li>
									<a href="/users">Пользователи</a>
								</li>
								<li>
									<a href="/divisions">Подразделения</a>
								</li>
								<li className="current-menu-item">
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
									<h1>Заседания</h1>
									<a href="#!" className="btn btn-add"><span>Добавить</span></a>
								</div>
								<div className="top__wrapper">
									<select>
										<option value="По дате начала">По дате начала</option>
										<option value="По дате начала 1">По дате начала 1</option>
										<option value="По дате начала 2">По дате начала 2</option>
									</select>
									<form className="search">
										<input type="text" placeholder="Поиск" />
										<button type="submit"></button>
									</form>
									<ul className="nav">
										<li><a href="#!"><img src="/img/icon_20.png" alt="" /></a></li>
										<li><a href="#!"><img src="/img/icon_8.png" alt="" /></a></li>
										<li><a href="#!"><img src="/img/icon_9.png" alt="" /></a></li>
									</ul>
								</div>
							</div>
							<div className="page__table">
								<table>
									<thead>
										<tr>
											<th>Название</th>
											<th>Начало</th>
											<th>Конец</th>
											<th>Подразделения</th>
											<th>Статус</th>
											<th></th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td>Внесение изменений в Устав</td>
											<td className="date">
												17.07.2025 <span>11:00</span>
											</td>
											<td className="date">
												17.07.2025 <span>15:00</span>
											</td>
											<td>Рабочая группа по внесению изменений в Устав, совет директоров, отдел кадров</td>
											<td style={{ whiteSpace: 'nowrap' }}>Ждет запуска</td>
											<td className="user__nav">
												<button className="user__button"><img src="/img/icon_10.png" alt="" /></button>
												<ul className="nav__links">
													<li><button data-fancybox="" data-src="#modal-meetings-edit"><img src="/img/icon_11.png" alt="" />Редактировать</button></li>
													<li><button><img src="/img/icon_21.png" alt="" />Результаты</button></li>
													<li><button><img src="/img/icon_13.png" alt="" />В архив</button></li>
													<li><button><img src="/img/icon_14.png" alt="" />Удалить</button></li>
												</ul>
											</td>
										</tr>
										<tr>
											<td>Внесение изменений в Устав</td>
											<td className="date">
												17.07.2025 <span>11:00</span>
											</td>
											<td className="date">
												17.07.2025 <span>15:00</span>
											</td>
											<td>Рабочая группа по внесению изменений в Устав, совет директоров, отдел кадров</td>
											<td style={{ whiteSpace: 'nowrap' }}>Идет</td>
											<td className="user__nav">
												<button className="user__button"><img src="/img/icon_10.png" alt="" /></button>
												<ul className="nav__links">
													<li><button data-fancybox="" data-src="#modal-meetings-edit"><img src="/img/icon_11.png" alt="" />Редактировать</button></li>
													<li><button><img src="/img/icon_21.png" alt="" />Результаты</button></li>
													<li><button><img src="/img/icon_13.png" alt="" />В архив</button></li>
													<li><button><img src="/img/icon_14.png" alt="" />Удалить</button></li>
												</ul>
											</td>
										</tr>
										<tr>
											<td>Внесение изменений в Устав</td>
											<td className="date">
												17.07.2025 <span>11:00</span>
											</td>
											<td className="date">
												17.07.2025 <span>15:00</span>
											</td>
											<td>Рабочая группа по внесению изменений в Устав, совет директоров, отдел кадров</td>
											<td style={{ whiteSpace: 'nowrap' }}>Завершено</td>
											<td className="user__nav">
												<button className="user__button"><img src="/img/icon_10.png" alt="" /></button>
												<ul className="nav__links">
													<li><button data-fancybox="" data-src="#modal-meetings-edit"><img src="/img/icon_11.png" alt="" />Редактировать</button></li>
													<li><button><img src="/img/icon_21.png" alt="" />Результаты</button></li>
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

				{/* modal-meetings-edit */}
				<div style={{ display: 'none' }} id="modal-meetings-edit" className="modal">
					<div className="modal__heading center">
						<h2>Редактировать заседание</h2>
					</div>
					<div className="form__inner">
						<form>
							<div className="form__item">
								<div className="item__title">Название заседания <sup>*</sup></div>
								<input type="text" placeholder="" defaultValue="Заседание 1" required />
							</div>
							<div className="form__item form__item-small">
								<div className="item__title">Дата и время начала заседания</div>
								<input type="text" className="datetime" />
							</div>
							<div className="form__item form__item-small">
								<div className="item__title">Дата и время окончания заседания</div>
								<input type="text" className="datetime" />
							</div>
							<div className="form__item">
								<div className="item__title">Добавить подразделение</div>
								<select>
									<option value="Без подразделения">Без подразделения</option>
									<option value="Без подразделения 1">Без подразделения 1</option>
									<option value="Без подразделения 2">Без подразделения 2</option>
								</select>
							</div>
							<div className="form__item">
								<div className="item__title">Участвующие подразделения:</div>
								<div className="user__list">
									<table>
										<tbody>
											<tr>
												<td>Отдел маркетинга</td>
												<td className="remove"><a href="#!"><img src="/img/icon_19.png" alt="" /></a></td>
											</tr>
											<tr>
												<td>Группа по внесению изменений в Устав</td>
												<td className="remove"><a href="#!"><img src="/img/icon_19.png" alt="" /></a></td>
											</tr>
											<tr>
												<td>Отдел маркетинга</td>
												<td className="remove"><a href="#!"><img src="/img/icon_19.png" alt="" /></a></td>
											</tr>
										</tbody>
									</table>
								</div>
								<div className="total">
									Итого: <strong>3 подразделения</strong>
								</div>
							</div>
							<div className="questions">
								<div className="questions__heading">
									<h3>Вопросы</h3>
									<a href="#!" className="btn btn-add"><span>Добавить</span></a>
								</div>
								<div className="questions__list">
									<div className="list__item">
										<div className="item__number">1.</div>
										<div className="item__content">
											<input type="text" className="input-question" defaultValue="Вопрос внесения изменений в Устав" />
											<div className="item__wrapper">
												<select>
													<option value="" disabled>Докладчик</option>
													<option value="Докладчик 1">Докладчик 1</option>
													<option value="Докладчик 2">Докладчик 2</option>
												</select>
												<input type="text" placeholder="Ссылка" />
											</div>
										</div>
										<div className="item__remove"><a href="#!"><img src="/img/icon_19.png" alt="" /></a></div>
									</div>
									<div className="list__item">
										<div className="item__number">2.</div>
										<div className="item__content">
											<input type="text" className="input-question" defaultValue="Вопрос внесения изменений в Устав" />
											<div className="item__wrapper">
												<select>
													<option value="" disabled>Докладчик</option>
													<option value="Докладчик 1">Докладчик 1</option>
													<option value="Докладчик 2">Докладчик 2</option>
												</select>
												<input type="text" placeholder="Ссылка" />
											</div>
										</div>
										<div className="item__remove"><a href="#!"><img src="/img/icon_19.png" alt="" /></a></div>
									</div>
								</div>
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

export default MeetingsPage;
