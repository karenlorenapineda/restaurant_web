import type { Locale } from "../i18n";
export interface LegalCopy {
  privacy: string;
  terms: string;
  updated: string;
  back: string;
  contents: string;
  contact: string;
  contactText: string;
  privacyIntro: string;
  termsIntro: string;
  privacySections: [string, string][];
  termsSections: [string, string][];
}
export const legalUpdated = "2026-11-05";
export const legalCopy: Record<Locale, LegalCopy> = {
  es: {
    privacy: "Política de privacidad",
    terms: "Términos de uso",
    updated: "Última actualización",
    back: "Volver al inicio",
    contents: "En esta página",
    contact: "Contacto con el equipo",
    contactText:
      "Picasso es un proyecto académico de gestión de restaurante. Para consultar el uso de tus datos, pedir acceso, corregirlos o solicitar su eliminación, contacta directamente con el equipo del proyecto a través de la persona o del canal por el que te facilitaron el acceso. El proyecto todavía no dispone de un correo de contacto público. No utilices el formulario de demostración para enviar estas solicitudes.",
    privacyIntro:
      "Esta política explica qué información utiliza la versión actual de Picasso al consultar la carta, probar pedidos y utilizar las herramientas del restaurante. Está dirigida a participantes y evaluadores del proyecto académico.",
    privacySections: [
      [
        "Quién gestiona la información",
        "El equipo del proyecto Picasso mantiene esta aplicación y su entorno de pruebas. El nombre Picasso identifica el proyecto; esta versión no identifica una sociedad mercantil ni ofrece un servicio comercial de restaurante. Utiliza datos ficticios durante las demostraciones.",
      ],
      [
        "Datos que utiliza la aplicación",
        "En el modo conectado se guardan los datos que envías en los pedidos: nombre, teléfono, dirección cuando hay entrega, platos, cantidades y notas. La gestión interna utiliza datos de empleados, su puesto y usuario vinculado; el chat guarda emisor, destinatario, mensaje y fecha. El servidor también genera registros técnicos de peticiones, que pueden incluir dirección IP, ruta, fecha y navegador. Evita incluir datos sensibles o de otras personas en notas y mensajes.",
      ],
      [
        "Para qué se utilizan y quién accede",
        "Los datos permiten registrar y consultar pedidos, gestionar la carta y existencias, coordinar al equipo, generar estadísticas de actividad del restaurante y diagnosticar fallos durante las pruebas. Pueden ser consultados por el equipo que mantiene y evalúa la instancia y por quienes tengan acceso a sus funciones internas. Los controles de autenticación y permisos siguen en desarrollo: utiliza la instancia únicamente en un entorno de pruebas controlado. Esta versión no incorpora publicidad ni venta de datos.",
      ],
      [
        "Almacenamiento en el navegador y recursos externos",
        "La selección de idioma se guarda en el navegador. En modo demostración, los pedidos de prueba también se guardan localmente y pueden seguir allí después de cerrar la página. Puedes eliminarlos borrando los datos del sitio en tu navegador; eso no borra los registros del servidor. El chat público y el formulario de contacto son demostraciones: no envían una solicitud al restaurante. Las imágenes cargadas desde una URL externa pueden comunicar tu IP y datos de la petición al servidor de esa imagen.",
      ],
      [
        "Conservación y seguridad",
        "Los datos del servidor se conservan para operar y revisar las pruebas del proyecto. Esta versión no tiene configurado un plazo de borrado automático: solicita al equipo la revisión o eliminación de tus registros cuando dejen de ser necesarios. Las copias de seguridad y los registros técnicos pueden conservar información adicional durante su gestión. HTTPS protege el transporte cuando se usa el despliegue configurado, pero ninguna medida elimina todos los riesgos. La aplicación no solicita ni procesa números de tarjeta ni códigos de seguridad.",
      ],
      [
        "Consultas y cambios de esta política",
        "Puedes pedir información sobre los datos asociados a tus pruebas, su corrección o eliminación al equipo responsable, mediante el contacto indicado abajo. El equipo debe revisar cada solicitud y las obligaciones que correspondan a la instancia. La política se revisará cuando cambien las funciones, el alojamiento o el uso del proyecto; consulta la fecha de actualización. No introduzcas datos reales de clientes hasta acordar con el responsable de la instancia las condiciones de ese uso.",
      ],
    ],
    termsIntro:
      "Estos términos describen el uso de la versión académica de Picasso: consulta de carta, pruebas de pedidos y herramientas internas de gestión del restaurante.",
    termsSections: [
      [
        "Finalidad y acceso",
        "Picasso se utiliza para aprendizaje, demostraciones y evaluación de un proyecto de desarrollo web. El acceso al panel interno debe acordarse con el equipo responsable. Un selector de vista o rol de demostración no acredita una identidad ni concede autorización para utilizar datos o funciones ajenos.",
      ],
      [
        "Pedidos, precios y disponibilidad",
        "La carta muestra importes en pesos colombianos (COP). En modo conectado, el servidor valida los platos disponibles y calcula el total al enviar el pedido; registrar un pedido no garantiza su aceptación comercial ni su preparación o entrega. En modo demostración, el pedido queda en ese navegador y no se comunica al restaurante. Confirma directamente con el responsable cualquier servicio real antes de contar con él.",
      ],
      [
        "Pagos y contenido de la carta",
        "Esta versión no cobra ni ofrece una pasarela de pago activa. No introduzcas números de tarjeta, códigos de seguridad o credenciales bancarias en ningún campo. Las imágenes y descripciones son orientativas para las pruebas y pueden cambiar. Para un pedido real, confirma ingredientes y requisitos alimentarios directamente con el restaurante.",
      ],
      [
        "Uso responsable",
        "Introduce solo información que estés autorizado a utilizar. No suplantes a otras personas, no publiques mensajes abusivos o información confidencial, ni intentes acceder a conversaciones, cuentas o registros ajenos. No alteres ni elimines datos del equipo fuera de las pruebas acordadas. Comunica errores o accesos inesperados al equipo del proyecto.",
      ],
      [
        "Contenido, disponibilidad y derechos",
        "Los textos, imágenes y demás materiales mantienen los derechos que correspondan a sus titulares; el acceso a la aplicación no autoriza a redistribuirlos sin permiso. El entorno puede interrumpirse o cambiar durante el desarrollo, por lo que no debe utilizarse como único registro de operaciones reales. Estos términos no excluyen los derechos que resulten obligatorios según la normativa aplicable.",
      ],
      [
        "Privacidad y actualización",
        "Consulta la política de privacidad para conocer los datos utilizados, el almacenamiento local y la forma de plantear solicitudes al equipo. Los cambios funcionales pueden requerir actualizar estos términos. La fecha indicada identifica la versión del texto; usar la aplicación no sustituye los consentimientos o acuerdos específicos que fueran necesarios para un tratamiento de datos o un servicio comercial.",
      ],
    ],
  },
  en: {
    privacy: "Privacy policy",
    terms: "Terms of use",
    updated: "Last updated",
    back: "Back to home",
    contents: "On this page",
    contact: "Contact the team",
    contactText:
      "Picasso is an academic restaurant management project. To ask about your data, request access, corrections or deletion, contact the project team directly through the person or channel that gave you access. The project does not yet have a public contact email. Do not use the demonstration contact form for these requests.",
    privacyIntro:
      "This policy explains the information used by the current version of Picasso when browsing the menu, testing orders and using restaurant tools. It is intended for participants and evaluators of the academic project.",
    privacySections: [
      [
        "Who manages the information",
        "The Picasso project team maintains this application and its test environment. Picasso is the project name; this version does not identify a commercial company or offer a commercial restaurant service. Use fictional data during demonstrations.",
      ],
      [
        "Information used by the application",
        "Connected mode stores the information you submit with orders: name, phone number, delivery address when relevant, dishes, quantities and notes. Internal management uses employee information, positions and linked users; chat stores sender, recipient, message and date. The server also generates request logs, which may include IP address, path, date and browser. Avoid sensitive information or other people’s data in notes and messages.",
      ],
      [
        "Purposes and access",
        "Information supports order records, menu and stock management, team coordination, restaurant activity statistics and troubleshooting during testing. The people maintaining and evaluating the instance, and those with access to internal features, may view it. Authentication and permission controls are still in development: use the instance only in a controlled test environment. This version includes neither advertising nor data sales.",
      ],
      [
        "Browser storage and external resources",
        "The selected language is stored in your browser. In demonstration mode, test orders are also stored locally and may remain after closing the page. You can remove them by clearing this site’s browser data; this does not erase server records. The public chat and contact form are demonstrations and do not send a request to the restaurant. Images loaded from external URLs may disclose your IP address and request information to the image server.",
      ],
      [
        "Retention and security",
        "Server data is retained to operate and review project tests. This version has no automatic deletion period configured: ask the team to review or delete records when they are no longer needed. Backups and technical logs may retain additional information while they are managed. HTTPS protects transport when using the configured deployment, but no measure removes every risk. The application does not request or process card numbers or security codes.",
      ],
      [
        "Requests and policy changes",
        "You can request information about data associated with your tests, corrections or deletion through the team contact described below. The team must review each request and the obligations relevant to the instance. This policy will be reviewed when features, hosting or project use change; check its update date. Do not enter real customer data until the instance operator has agreed the conditions for that use.",
      ],
    ],
    termsIntro:
      "These terms describe the academic version of Picasso: menu browsing, test orders and internal restaurant management tools.",
    termsSections: [
      [
        "Purpose and access",
        "Picasso is used for learning, demonstrations and evaluation of a web development project. Access to internal tools must be agreed with the responsible team. A demonstration view or role selector does not establish identity or authorize access to other people’s information or features.",
      ],
      [
        "Orders, prices and availability",
        "The menu displays Colombian peso (COP) amounts. In connected mode, the server validates available dishes and calculates the total when an order is submitted; recording an order does not guarantee commercial acceptance, preparation or delivery. In demonstration mode, orders remain in that browser and are not sent to the restaurant. Confirm any real service directly with the responsible person before relying on it.",
      ],
      [
        "Payments and menu content",
        "This version does not charge customers or provide an active payment gateway. Do not enter card numbers, security codes or banking credentials in any field. Images and descriptions are illustrative for testing and may change. For an actual order, confirm ingredients and dietary requirements directly with the restaurant.",
      ],
      [
        "Responsible use",
        "Only enter information you are authorized to use. Do not impersonate others, post abusive messages or confidential information, or attempt to access other people’s conversations, accounts or records. Do not change or delete team data outside agreed tests. Report errors or unexpected access to the project team.",
      ],
      [
        "Content, availability and rights",
        "Texts, images and other materials retain the rights of their respective owners; access does not grant permission to redistribute them. The environment may be interrupted or changed during development and should not be the sole record of real operations. These terms do not exclude rights that are mandatory under applicable rules.",
      ],
      [
        "Privacy and updates",
        "Read the privacy policy for information about data use, local storage and requests to the team. Functional changes may require updates to these terms. The date identifies this text’s version; using the application does not replace any specific consent or agreement needed for processing data or providing a commercial service.",
      ],
    ],
  },
  pt: {
    privacy: "Política de privacidade",
    terms: "Termos de utilização",
    updated: "Última atualização",
    back: "Voltar ao início",
    contents: "Nesta página",
    contact: "Contactar a equipa",
    contactText:
      "Picasso é um projeto académico de gestão de restaurante. Para esclarecer a utilização dos seus dados, pedir acesso, correção ou eliminação, contacte diretamente a equipa através da pessoa ou do canal que lhe facultou o acesso. O projeto ainda não dispõe de um email de contacto público. Não utilize o formulário de demonstração para estes pedidos.",
    privacyIntro:
      "Esta política explica a informação utilizada pela versão atual do Picasso ao consultar o menu, testar pedidos e utilizar as ferramentas do restaurante. Destina-se a participantes e avaliadores do projeto académico.",
    privacySections: [
      [
        "Quem gere a informação",
        "A equipa do projeto Picasso mantém esta aplicação e o seu ambiente de testes. Picasso é o nome do projeto; esta versão não identifica uma sociedade comercial nem oferece um serviço comercial de restaurante. Utilize dados fictícios nas demonstrações.",
      ],
      [
        "Dados utilizados pela aplicação",
        "No modo ligado ao servidor são guardados os dados enviados nos pedidos: nome, telefone, morada quando existe entrega, pratos, quantidades e notas. A gestão interna utiliza dados de funcionários, cargos e utilizadores associados; o chat guarda remetente, destinatário, mensagem e data. O servidor também gera registos técnicos de pedidos que podem incluir endereço IP, caminho, data e navegador. Evite dados sensíveis ou de outras pessoas nas notas e mensagens.",
      ],
      [
        "Finalidades e acesso",
        "Os dados permitem registar e consultar pedidos, gerir o menu e as existências, coordenar a equipa, gerar estatísticas da atividade do restaurante e diagnosticar falhas durante os testes. Podem ser consultados pela equipa que mantém e avalia a instalação e por quem tiver acesso às funções internas. A autenticação e as permissões continuam em desenvolvimento: utilize a instalação apenas num ambiente de testes controlado. Esta versão não inclui publicidade nem venda de dados.",
      ],
      [
        "Armazenamento no navegador e recursos externos",
        "O idioma escolhido é guardado no navegador. No modo de demonstração, os pedidos de teste também são guardados localmente e podem permanecer após fechar a página. Pode eliminá-los apagando os dados deste site no navegador; isso não elimina os registos do servidor. O chat público e o formulário de contacto são demonstrações e não enviam pedidos ao restaurante. Imagens carregadas de URLs externas podem comunicar o seu IP e dados do pedido ao servidor da imagem.",
      ],
      [
        "Conservação e segurança",
        "Os dados do servidor são conservados para operar e rever os testes do projeto. Esta versão não tem um prazo de eliminação automática configurado: peça à equipa que reveja ou elimine os registos quando deixarem de ser necessários. Cópias de segurança e registos técnicos podem conservar informação adicional durante a sua gestão. HTTPS protege o transporte no alojamento configurado, mas nenhuma medida elimina todos os riscos. A aplicação não solicita nem processa números de cartão ou códigos de segurança.",
      ],
      [
        "Pedidos e alterações da política",
        "Pode solicitar informação sobre os dados associados aos seus testes, a sua correção ou eliminação através do contacto da equipa indicado abaixo. A equipa deve rever cada pedido e as obrigações aplicáveis à instalação. A política será revista quando mudarem as funções, o alojamento ou a utilização do projeto; consulte a data de atualização. Não introduza dados reais de clientes até acordar com o responsável da instalação as condições dessa utilização.",
      ],
    ],
    termsIntro:
      "Estes termos descrevem a versão académica do Picasso: consulta do menu, pedidos de teste e ferramentas internas de gestão do restaurante.",
    termsSections: [
      [
        "Finalidade e acesso",
        "Picasso é utilizado para aprendizagem, demonstrações e avaliação de um projeto de desenvolvimento web. O acesso às ferramentas internas deve ser acordado com a equipa responsável. Um seletor de vista ou função de demonstração não comprova identidade nem autoriza o acesso a informações ou funções de outras pessoas.",
      ],
      [
        "Pedidos, preços e disponibilidade",
        "O menu apresenta valores em pesos colombianos (COP). No modo ligado ao servidor, este valida os pratos disponíveis e calcula o total ao enviar o pedido; registar um pedido não garante aceitação comercial, preparação ou entrega. No modo de demonstração, o pedido fica nesse navegador e não é enviado ao restaurante. Confirme qualquer serviço real diretamente com o responsável antes de contar com ele.",
      ],
      [
        "Pagamentos e conteúdo do menu",
        "Esta versão não cobra nem oferece uma plataforma de pagamento ativa. Não introduza números de cartão, códigos de segurança ou credenciais bancárias em qualquer campo. As imagens e descrições são ilustrativas para os testes e podem mudar. Para um pedido real, confirme ingredientes e requisitos alimentares diretamente com o restaurante.",
      ],
      [
        "Utilização responsável",
        "Introduza apenas informações que esteja autorizado a utilizar. Não se faça passar por outras pessoas, não publique mensagens abusivas ou informações confidenciais, nem tente aceder a conversas, contas ou registos de terceiros. Não altere nem elimine dados da equipa fora dos testes acordados. Comunique erros ou acessos inesperados à equipa do projeto.",
      ],
      [
        "Conteúdo, disponibilidade e direitos",
        "Os textos, imagens e outros materiais mantêm os direitos dos respetivos titulares; o acesso à aplicação não autoriza a sua redistribuição sem permissão. O ambiente pode ser interrompido ou alterado durante o desenvolvimento e não deve ser o único registo de operações reais. Estes termos não excluem direitos obrigatórios segundo as normas aplicáveis.",
      ],
      [
        "Privacidade e atualização",
        "Consulte a política de privacidade para conhecer os dados utilizados, o armazenamento local e como apresentar pedidos à equipa. Alterações funcionais podem exigir a atualização destes termos. A data identifica a versão do texto; utilizar a aplicação não substitui consentimentos ou acordos específicos necessários ao tratamento de dados ou à prestação de um serviço comercial.",
      ],
    ],
  },
};
