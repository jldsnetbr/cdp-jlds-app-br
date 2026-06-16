const Nav = {
    currentSection: 'Ponto',

    init() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');

                const section = item.querySelector('span:last-child').textContent;
                this.navigateTo(section);
            });
        });

        document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
        document.getElementById('modalOverlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeModal();
        });
    },

    async navigateTo(section) {
        this.currentSection = section;
        const main = document.querySelector('.app-main');

        switch (section) {
            case 'Banco':
                await Banco.show(main);
                break;
            case 'Ponto':
                Ponto.show(main);
                break;
            case 'Perfil':
                await Perfil.show(main);
                break;
        }
    },

    openModal({ title, body, footer }) {
        const modal = document.getElementById('modalOverlay');
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = body;
        document.getElementById('modalFooter').innerHTML = footer;
        modal.classList.remove('hidden');
    },

    closeModal() {
        document.getElementById('modalOverlay').classList.add('hidden');
    }
};
