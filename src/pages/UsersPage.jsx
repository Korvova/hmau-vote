import React from 'react';
import EditModal from '../components/EditModal.jsx';

function UsersPage() {
	const [configOpen, setConfigOpen] = React.useState(false);
  	const [selectedUser, setSelectedUser] = React.useState(null);
  	const [isEditModalOpen, setEditModalOpen] = React.useState(false);

	const users = [
		{
		id: 1,
		fullName: 'Петров Иван Сергеевич',
		email: 'petrov@mail.ru',
		phone: '+7 904 245 67 77',
		division: 'Отдел маркетинга',
		status: 'off',
		},
		{
		id: 2,
		fullName: 'Сидорова Елена Андреевна',
		email: 'petrov@mail.ru',
		phone: '+7 904 245 67 77',
		division: 'Отдел маркетинга',
		status: 'on',
		},
		{
		id: 3,
		fullName: 'Иванов Вениамин Владимирович',
		email: 'petrov@mail.ru',
		phone: '+7 904 245 67 77',
		division: 'Отдел маркетинга',
		status: 'off',
		},
		{
		id: 4,
		fullName: 'Петров Иван Сергеевич',
		email: 'petrov@mail.ru',
		phone: '+7 904 245 67 77',
		division: 'Отдел маркетинга',
		status: 'off',
		},
	];

	// Конфигурация полей для модалки редактирования пользователя
	const userFields = [
		{ name: 'fullName', label: 'ФИО', type: 'text', required: true },
		{ name: 'email', label: 'E‑mail', type: 'text', required: true },
		{ name: 'phone', label: 'Телефон', type: 'text', required: true },
		{ name: 'division', label: 'Подразделение', type: 'text', required: false },
	];

	const handleEditClick = (user) => {
		setSelectedUser(user);
		setEditModalOpen(true);
	};

	const handleUpdate = (updatedData, password) => {
		// Здесь можно отправить данные на сервер и проверить пароль
		console.log('Updated data:', updatedData, 'Password:', password);
		// После сохранения закрываем модалку
		setEditModalOpen(false);
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
										<th>E‑mail</th>
										<th>Моб. телефон</th>
										<th>Подразделение</th>
										<th className="th-state">Статус</th>
										<th></th>
										</tr>
									</thead>
									<tbody>
										{users.map((user) => (
										<tr key={user.id}>
											<td>{user.fullName}</td>
											<td>{user.email}</td>
											<td>{user.phone}</td>
											<td>{user.division}</td>
											<td className={`state state-${user.status}`}>
											<span></span>
											</td>
											<td className="user__nav">
											<button className="user__button">
												<img src="/img/icon_10.png" alt="" />
											</button>
											<ul className="nav__links">
												<li>
												<button onClick={() => handleEditClick(user)}>
													<img src="/img/icon_11.png" alt="" />
													Редактировать
												</button>
												</li>
												<li>
												<button>
													<img src="/img/icon_12.png" alt="" />
													Заблокировать
												</button>
												</li>
												<li>
												<button>
													<img src="/img/icon_13.png" alt="" />
													В архив
												</button>
												</li>
												<li>
												<button>
													<img src="/img/icon_14.png" alt="" />
													Удалить
												</button>
												</li>
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

				{/* modal-user-edit */}
				<EditModal
					open={isEditModalOpen}
					data={selectedUser}
					fields={userFields}
					onClose={() => setEditModalOpen(false)}
					onSubmit={handleUpdate}
				/>
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
