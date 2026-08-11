export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface-bg px-5 py-10">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-surface-border shadow-sm p-6 sm:p-8">
        <h1 className="font-serif text-2xl text-gray-900 mb-1">Termos de Uso</h1>
        <p className="text-xs text-gray-400 mb-6">Última atualização: agosto de 2026</p>

        <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
          <p>
            Estes Termos regem o uso do Menuair, plataforma de cardápio digital e gestão de
            pedidos para restaurantes. Ao contratar o serviço, você concorda com o disposto
            abaixo.
          </p>
          <p>
            <strong>1. O que oferecemos.</strong> Cardápio digital com pedidos online e
            pagamento via Pix, painel administrativo para gestão de produtos, categorias,
            pedidos e financeiro, conforme o plano contratado (Start ou Pro).
          </p>
          <p>
            <strong>2. Mensalidade e pagamento.</strong> O acesso é cobrado mensalmente, com
            valor definido pelo plano contratado no momento da assinatura. O pagamento é feito
            via Pix, com confirmação manual. Reajustes de valor serão comunicados com
            antecedência.
          </p>
          <p>
            <strong>3. Cancelamento.</strong> Não há fidelidade contratual. O cancelamento pode
            ser solicitado a qualquer momento, encerrando a cobrança seguinte.
          </p>
          <p>
            <strong>4. Responsabilidades do cliente.</strong> O restaurante é responsável pela
            veracidade das informações cadastradas (produtos, preços, dados de contato) e por
            garantir que possui os direitos necessários sobre imagens e conteúdo publicado em
            seu cardápio.
          </p>
          <p>
            <strong>5. Disponibilidade.</strong> Empregamos esforços razoáveis para manter o
            serviço disponível, mas não garantimos operação ininterrupta. Manutenções podem
            gerar indisponibilidade temporária.
          </p>
          <p>
            <strong>6. Dados.</strong> O tratamento de dados dos clientes finais (quem faz
            pedidos) segue nosso{" "}
            <a href="/privacidade" className="underline hover:text-brand">
              Aviso de Privacidade
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}