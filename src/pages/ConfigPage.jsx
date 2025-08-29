import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function ConfigPage() {
	const [configOpen, setConfigOpen] = React.useState(false);
	const [meetings, setMeetings] = useState([]);
	const navigate = useNavigate();

	useEffect(() => {
		setMeetings([
			{ id: 1, name: 'Внесение изменений в Устав', startTime: '2025-07-17 11:00', endTime: '2025-07-17 15:00', divisions: 'Рабочая группа по внесению изменений в Устав, совет директоров, отдел кадров', status: 'IN_PROGRESS', isArchived: false },
			{ id: 2, name: 'Внесение изменений в Устав', startTime: '2025-07-17 11:00', endTime: '2025-07-17 15:00', divisions: 'Рабочая группа по внесению изменений в Устав, совет директоров, отдел кадров', status: 'WAITING', isArchived: false },
			{ id: 3, name: 'Внесение изменений в Устав', startTime: '2025-07-17 11:00', endTime: '2025-07-17 15:00', divisions: 'Рабочая группа по внесению изменений в Устав, совет директоров, отдел кадров', status: 'DONE', isArchived: false },
		]);
	}, []);

	const handleArchiveMeeting = (meetingId) => {
		setMeetings(meetings.map(m => m.id === meetingId ? { ...m, isArchived: true } : m));
	};

	const handleMeetingClick = (meetingId) => {
		navigate(`/admin/control/meeting/${meetingId}`);
	};

	const renderStatus = (status) => {
		if (status === 'WAITING') return 'Ждет запуска';
		if (status === 'IN_PROGRESS') return 'Идет';
		return 'Завершено';
	};

	const showPdf = (status) => status !== 'WAITING';

	return (
		<>
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
										<li className="menu-children"><a href="#!"><img src="/img/icon_2.png" alt="" />admin@admin.ru</a></li>
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
								<li><a href="/users">Пользователи</a></li>
								<li><a href="/divisions">Подразделения</a></li>
								<li><a href="/meetings">Заседания</a></li>
								<li className="current-menu-item"><a href="/console">Пульт Заседания</a></li>
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

			<main>
				<section id="page">
					<div className="container">
						<div className="wrapper">
							<div className="page__top">
								<div className="top__heading">
									<h1>Управление заседаниями</h1>
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
											<th>Результат</th>
											<th>Действие</th>
											<th></th>
										</tr>
									</thead>
									<tbody>
										{meetings.filter(m => !m.isArchived).map(m => (
											<tr key={m.id}>
												<td>{m.name}</td>
												<td className="date">{m.startTime.split(' ')[0]} <span>{m.startTime.split(' ')[1]}</span></td>
												<td className="date">{m.endTime.split(' ')[0]} <span>{m.endTime.split(' ')[1]}</span></td>
												<td>{m.divisions}</td>
												<td style={{ whiteSpace: 'nowrap' }}>{renderStatus(m.status)}</td>
												<td>{showPdf(m.status) ? <a href="#!"><img src="/img/icon_23.png" alt="" /></a> : ''}</td>
												<td><a href="#!" onClick={(e) => { e.preventDefault(); handleMeetingClick(m.id); }}>Управлять</a></td>
												<td className="user__nav">
													<button className="user__button"><img src="/img/icon_10.png" alt="" /></button>
													<ul className="nav__links">
														<li><button><img src="/img/icon_11.png" alt="" />Редактировать</button></li>
														<li><button><img src="/img/icon_21.png" alt="" />Результаты</button></li>
														<li><button onClick={(e) => { e.stopPropagation(); handleArchiveMeeting(m.id); }}><img src="/img/icon_13.png" alt="" />В архив</button></li>
														<li><button><img src="/img/icon_14.png" alt="" />Удалить</button></li>
													</ul>
												</td>
											</tr>
										))}
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

export default ConfigPage;
